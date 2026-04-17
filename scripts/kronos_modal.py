import modal

app = modal.App("kronos-predictor")

kronos_image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("git")
    .pip_install(
        "torch>=2.0.0",
        "numpy",
        "pandas==2.2.2",
        "einops==0.8.1",
        "huggingface_hub==0.33.1",
        "safetensors==0.6.2",
        "tqdm==4.67.1",
        "fastapi[standard]",
    )
    .run_commands("git clone --depth 1 https://github.com/shiyu-coder/Kronos.git /opt/kronos")
)

# Model registry: size → (tokenizer_repo, model_repo, max_context)
MODELS = {
    "mini":  ("NeoQuasar/Kronos-Tokenizer-2k",   "NeoQuasar/Kronos-mini",  2048),
    "small": ("NeoQuasar/Kronos-Tokenizer-base", "NeoQuasar/Kronos-small", 512),
    "base":  ("NeoQuasar/Kronos-Tokenizer-base", "NeoQuasar/Kronos-base",  512),
}


@app.cls(image=kronos_image, gpu="T4", scaledown_window=300)
class KronosService:
    @modal.enter()
    def load_models(self):
        import sys
        sys.path.insert(0, "/opt/kronos")
        from model import Kronos, KronosTokenizer, KronosPredictor

        self.predictors = {}
        # Cache tokenizers per repo to avoid duplicate loads
        tokenizer_cache = {}

        for size, (tok_repo, model_repo, max_ctx) in MODELS.items():
            if tok_repo not in tokenizer_cache:
                tokenizer_cache[tok_repo] = KronosTokenizer.from_pretrained(tok_repo)
            tokenizer = tokenizer_cache[tok_repo]
            model = Kronos.from_pretrained(model_repo)
            self.predictors[size] = KronosPredictor(
                model, tokenizer, max_context=max_ctx
            )

    @modal.method()
    def predict(
        self,
        ohlcv_data: dict,
        prediction_length: int = 24,
        model_size: str = "small",
    ) -> dict:
        import sys
        sys.path.insert(0, "/opt/kronos")
        import pandas as pd

        if model_size not in self.predictors:
            raise ValueError(f"Unknown model_size: {model_size}. Available: {list(self.predictors.keys())}")

        predictor = self.predictors[model_size]

        df = pd.DataFrame(ohlcv_data["data"], columns=ohlcv_data["columns"])
        x_timestamp = pd.Series(pd.to_datetime(ohlcv_data["timestamps"]))

        if len(x_timestamp) >= 2:
            freq = x_timestamp.iloc[-1] - x_timestamp.iloc[-2]
        else:
            freq = pd.Timedelta(hours=1)

        y_timestamp = pd.Series(pd.date_range(
            start=x_timestamp.iloc[-1] + freq,
            periods=prediction_length,
            freq=freq,
        ))

        result = predictor.predict(
            df=df,
            x_timestamp=x_timestamp,
            y_timestamp=y_timestamp,
            pred_len=prediction_length,
            T=1.0,
            top_p=0.9,
            sample_count=1,
            verbose=False,
        )

        ohlc_cols = [c for c in ["open", "high", "low", "close"] if c in result.columns]
        result = result[ohlc_cols]

        return {
            "columns": result.columns.tolist(),
            "data": result.values.tolist(),
            "timestamps": result.index.astype(str).tolist(),
            "model": model_size,
        }

    @modal.fastapi_endpoint(method="POST")
    def api(self, request: dict) -> dict:
        prediction_length = request.get("prediction_length", 24)
        model_size = request.get("model_size", "small")
        return self.predict.remote(request["ohlcv"], prediction_length, model_size)
