(function () {
  // ?static=1 → no hover effects, descriptions always visible (for screenshots)
  if (/[?&]static=1/.test(location.search)) {
    document.documentElement.classList.add('static');
  }

  var chains = [
    {
      id: 'ethereum', name: 'Ethereum', type: 'L1', color: '#627EEA', logo: 'ethereum.svg',
      tvl: '$47.2B', protocols: '700+',
      desc: 'La red más establecida y segura del ecosistema DeFi',
      explorer: 'https://etherscan.io',
    },
    {
      id: 'arbitrum', name: 'Arbitrum', type: 'L2', color: '#12AAFF', logo: 'arbitrum.svg',
      tvl: '$2.3B', protocols: '340+',
      desc: 'Layer 2 de Ethereum: rápido, económico y con alta seguridad',
      explorer: 'https://arbiscan.io',
    },
    {
      id: 'optimism', name: 'Optimism', type: 'L2', color: '#FF0420', logo: 'optimism.svg',
      tvl: '$760M', protocols: '160+',
      desc: 'Layer 2 pionero con gobernanza on-chain y bien público',
      explorer: 'https://optimistic.etherscan.io',
    },
    {
      id: 'polygon', name: 'Polygon', type: 'L2', color: '#6C00F6', logo: 'polygon.svg',
      tvl: '$870M', protocols: '430+',
      desc: 'Red escalable con el mayor ecosistema de aplicaciones EVM',
      explorer: 'https://polygonscan.com',
    },
    {
      id: 'base', name: 'Base', type: 'L2', color: '#0052FF', logo: 'base.svg',
      tvl: '$2.9B', protocols: '220+',
      desc: 'Layer 2 de Coinbase: accesible, simple y de adopción masiva',
      explorer: 'https://basescan.org',
    },
    {
      id: 'hyperevm', name: 'HyperEVM', type: 'L1', color: '#00D4AA', logo: 'hyperliquid.png',
      tvl: '$420M', protocols: '60+',
      desc: 'EVM sobre HyperLiquid: ultra alta frecuencia y latencia mínima',
      explorer: 'https://hyperevmscan.io',
    },
  ];

  function render() {
    var grid = document.getElementById('grid');
    grid.innerHTML = chains.map(function (c) {
      return (
        '<div class="card" style="--chain-color:' + c.color + '">' +
          '<div class="card-header">' +
            '<span class="card-logo"><img src="logos/' + c.logo + '" alt="' + c.name + '"></span>' +
            '<div>' +
              '<div class="card-name">' + c.name + '</div>' +
              '<span class="card-badge">' + c.type + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="card-divider"></div>' +
          '<div class="card-stats">' +
            '<div class="stat-row">' +
              '<span class="stat-label">TVL</span>' +
              '<span class="stat-value">' + c.tvl + '</span>' +
            '</div>' +
            '<div class="stat-row">' +
              '<span class="stat-label">Protocolos DeFi</span>' +
              '<span class="stat-value">' + c.protocols + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="card-desc">' + c.desc + '</div>' +
          '<a class="card-explorer" href="' + c.explorer + '" target="_blank" rel="noopener noreferrer">' +
            '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' +
            'Explorer' +
          '</a>' +
        '</div>'
      );
    }).join('');
  }

  render();
}());
