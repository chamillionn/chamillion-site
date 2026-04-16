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


@app.cls(image=kronos_image, gpu="T4", scaledown_window=300)
class KronosService:
    @modal.enter()
    def load_model(self):
        import sys
        sys.path.insert(0, "/opt/kronos")
        from model import Kronos, KronosTokenizer, KronosPredictor

        self.tokenizer = KronosTokenizer.from_pretrained(
            "NeoQuasar/Kronos-Tokenizer-base"
        )
        self.model = Kronos.from_pretrained("NeoQuasar/Kronos-small")
        self.predictor = KronosPredictor(
            self.model, self.tokenizer, max_context=512
        )

    @modal.method()
    def predict(self, ohlcv_data: dict, prediction_length: int = 24) -> dict:
        import sys
        sys.path.insert(0, "/opt/kronos")
        import pandas as pd

        df = pd.DataFrame(ohlcv_data["data"], columns=ohlcv_data["columns"])
        timestamps = pd.to_datetime(ohlcv_data["timestamps"])

        result = self.predictor.predict(
            df, timestamps, prediction_length=prediction_length
        )

        return {
            "columns": result.columns.tolist(),
            "data": result.values.tolist(),
            "timestamps": result.index.astype(str).tolist(),
        }

    @modal.fastapi_endpoint(method="POST")
    def api(self, request: dict) -> dict:
        prediction_length = request.get("prediction_length", 24)
        return self.predict.remote(request["ohlcv"], prediction_length)
