<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Investment Portfolio - Aluma Banking</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
            color: #333;
        }

        .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            width: 260px;
            height: 100vh;
            background: #161E44;
            padding: 20px 0;
            z-index: 1000;
            overflow-y: auto;
        }

        .logo {
            padding: 0 20px 30px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logo h2 {
            color: #fff;
            font-size: 24px;
        }

        .nav-menu {
            padding: 20px 0;
        }

        .nav-item {
            padding: 12px 20px;
            color: #a0a8c0;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 15px;
            transition: all 0.3s;
            cursor: pointer;
        }

        .nav-item:hover, .nav-item.active {
            background: rgba(71, 175, 9, 0.1);
            color: #47af09;
            border-left: 3px solid #47af09;
        }

        .nav-item i {
            width: 20px;
            font-size: 18px;
        }

        .main-content {
            margin-left: 260px;
            padding: 20px;
            min-height: 100vh;
        }

        .header {
            background: #fff;
            padding: 20px 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header h1 {
            font-size: 28px;
            color: #161E44;
            margin-bottom: 5px;
        }

        .header p {
            color: #666;
            font-size: 14px;
        }

        .trade-btn {
            background: #47af09;
            color: #fff;
            border: none;
            padding: 12px 25px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
        }

        .trade-btn:hover {
            background: #3a8f07;
        }

        .portfolio-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: #fff;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .stat-label {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
        }

        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #161E44;
            margin-bottom: 5px;
        }

        .stat-change {
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .stat-change.positive {
            color: #2e7d32;
        }

        .stat-change.negative {
            color: #c62828;
        }

        .content-section {
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            margin-bottom: 20px;
        }

        .section-header {
            padding: 20px 25px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #161E44;
        }

        .section-body {
            padding: 25px;
        }

        .positions-table {
            width: 100%;
            border-collapse: collapse;
        }

        .positions-table thead {
            background: #f8f9fa;
        }

        .positions-table th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #666;
            font-size: 13px;
            text-transform: uppercase;
        }

        .positions-table td {
            padding: 15px 12px;
            border-bottom: 1px solid #f0f0f0;
        }

        .positions-table tr:hover {
            background: #f8f9fa;
        }

        .symbol {
            font-weight: 600;
            color: #161E44;
            font-size: 16px;
        }

        .company-name {
            color: #666;
            font-size: 13px;
            margin-top: 3px;
        }

        .positive-value {
            color: #2e7d32;
            font-weight: 600;
        }

        .negative-value {
            color: #c62828;
            font-weight: 600;
        }

        .badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge-pending {
            background: #fff3e0;
            color: #f57c00;
        }

        .badge-filled {
            background: #e8f5e9;
            color: #2e7d32;
        }

        .badge-cancelled {
            background: #ffebee;
            color: #c62828;
        }

        .badge-buy {
            background: #e3f2fd;
            color: #1976d2;
        }

        .badge-sell {
            background: #fce4ec;
            color: #c2185b;
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 2000;
            align-items: center;
            justify-content: center;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background: #fff;
            border-radius: 10px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
        }

        .modal-header {
            padding: 20px 25px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-title {
            font-size: 20px;
            font-weight: 600;
            color: #161E44;
        }

        .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }

        .modal-body {
            padding: 25px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
            font-size: 14px;
        }

        .form-input, .form-select {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            font-size: 14px;
        }

        .form-input:focus, .form-select:focus {
            outline: none;
            border-color: #47af09;
            box-shadow: 0 0 0 3px rgba(71, 175, 9, 0.1);
        }

        .btn {
            padding: 12px 25px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s;
        }

        .btn-primary {
            background: #47af09;
            color: #fff;
        }

        .btn-primary:hover {
            background: #3a8f07;
        }

        .btn-secondary {
            background: #f5f5f5;
            color: #333;
        }

        .btn-secondary:hover {
            background: #e0e0e0;
        }

        .btn-block {
            width: 100%;
        }

        .order-summary {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }

        .summary-row:last-child {
            margin-bottom: 0;
            padding-top: 10px;
            border-top: 1px solid #e0e0e0;
            font-weight: 600;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }

        .empty-state i {
            font-size: 64px;
            color: #e0e0e0;
            margin-bottom: 20px;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }

        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #47af09;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .alert {
            padding: 15px 20px;
            border-radius: 5px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .alert-success {
            background: #e8f5e9;
            color: #2e7d32;
            border-left: 4px solid #4caf50;
        }

        .alert-error {
            background: #ffebee;
            color: #c62828;
            border-left: 4px solid #f44336;
        }

        .tab-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        .tab-btn {
            padding: 10px 20px;
            border: none;
            background: #f5f5f5;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }

        .tab-btn.active {
            background: #47af09;
            color: #fff;
        }

        @media (max-width: 768px) {
            .sidebar {
                width: 70px;
            }

            .sidebar .nav-item span {
                display: none;
            }

            .main-content {
                margin-left: 70px;
            }

            .portfolio-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .positions-table {
                font-size: 12px;
            }

            .positions-table th,
            .positions-table td {
                padding: 8px;
            }
        }
    </style>
</head>
<body>
    <aside class="sidebar">
        <div class="logo">
            <h2>Aluma</h2>
        </div>
        <nav class="nav-menu">
            <a href="dashboard.html" class="nav-item">
                <i class="fas fa-home"></i>
                <span>Dashboard</span>
            </a>
            <a href="accounts.html" class="nav-item">
                <i class="fas fa-wallet"></i>
                <span>Accounts</span>
            </a>
            <a href="transactions.html" class="nav-item">
                <i class="fas fa-exchange-alt"></i>
                <span>Transactions</span>
            </a>
            <a href="transfer.html" class="nav-item">
                <i class="fas fa-paper-plane"></i>
                <span>Transfer</span>
            </a>
            <a href="investments.html" class="nav-item active">
                <i class="fas fa-chart-line"></i>
                <span>Investments</span>
            </a>
            <a href="profile.html" class="nav-item">
                <i class="fas fa-user"></i>
                <span>Profile</span>
            </a>
            <a href="support.html" class="nav-item">
                <i class="fas fa-headset"></i>
                <span>Support</span>
            </a>
        </nav>
    </aside>

    <main class="main-content">
        <div class="header">
            <div>
                <h1>Investment Portfolio</h1>
                <p>Manage your investments and trades</p>
            </div>
            <button class="trade-btn" onclick="openTradeModal()">
                <i class="fas fa-plus"></i> Place Order
            </button>
        </div>

        <div class="portfolio-grid">
            <div class="stat-card">
                <div class="stat-label">Portfolio Value</div>
                <div class="stat-value" id="portfolioValue">$0.00</div>
                <div class="stat-change positive" id="portfolioChange">
                    <i class="fas fa-arrow-up"></i> $0.00 (0.00%)
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-label">Total Cost</div>
                <div class="stat-value" id="totalCost">$0.00</div>
                <div class="stat-change" id="costChange">Total invested</div>
            </div>

            <div class="stat-card">
                <div class="stat-label">Total Gain/Loss</div>
                <div class="stat-value" id="totalGainLoss">$0.00</div>
                <div class="stat-change" id="gainLossPercent">0.00%</div>
            </div>

            <div class="stat-card">
                <div class="stat-label">Positions</div>
                <div class="stat-value" id="positionsCount">0</div>
                <div class="stat-change">Active holdings</div>
            </div>
        </div>

        <div class="content-section">
            <div class="section-header">
                <h2 class="section-title">My Positions</h2>
                <button class="btn btn-secondary" onclick="loadPositions()">
                    <i class="fas fa-sync"></i> Refresh
                </button>
            </div>
            <div class="section-body">
                <div id="positionsContainer">
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Loading positions...</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="content-section">
            <div class="section-header">
                <h2 class="section-title">Recent Orders</h2>
                <div class="tab-buttons">
                    <button class="tab-btn active" data-filter="all" onclick="filterOrders('all')">All</button>
                    <button class="tab-btn" data-filter="pending" onclick="filterOrders('pending')">Pending</button>
                    <button class="tab-btn" data-filter="filled" onclick="filterOrders('filled')">Filled</button>
                    <button class="tab-btn" data-filter="cancelled" onclick="filterOrders('cancelled')">Cancelled</button>
                </div>
            </div>
            <div class="section-body">
                <div id="ordersContainer">
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Loading orders...</p>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <div class="modal" id="tradeModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Place Order</h2>
                <button class="close-btn" onclick="closeTradeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="tradeForm">
                    <div class="form-group">
                        <label class="form-label">Account</label>
                        <select class="form-select" name="accountId" required id="accountSelect">
                            <option value="">Select account...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Symbol</label>
                        <input type="text" class="form-input" name="symbol" required placeholder="e.g., AAPL" style="text-transform: uppercase;">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Action</label>
                        <select class="form-select" name="side" required>
                            <option value="buy">Buy</option>
                            <option value="sell">Sell</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Order Type</label>
                        <select class="form-select" name="orderType" required onchange="togglePriceFields(this.value)">
                            <option value="market">Market</option>
                            <option value="limit">Limit</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Quantity</label>
                        <input type="number" class="form-input" name="quantity" required min="1" step="1">
                    </div>

                    <div class="form-group" id="limitPriceGroup" style="display: none;">
                        <label class="form-label">Limit Price</label>
                        <input type="number" class="form-input" name="limitPrice" step="0.01" min="0.01">
                    </div>

                    <div class="order-summary" id="orderSummary" style="display: none;">
                        <div class="summary-row">
                            <span>Estimated Cost:</span>
                            <span id="estimatedCost">$0.00</span>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">
                        <i class="fas fa-check"></i> Place Order
                    </button>
                </form>
            </div>
        </div>
    </div>

    <script src="investments.js"></script>
</body>
</html>