function Dashboard() {
  return (
    <main className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <p className="welcome-text">WELCOME BACK 👋</p>
          <h1>Good afternoon, Pranjal</h1>
          <p className="header-subtitle">
            Here's what's happening with your money today.
          </p>
        </div>

        <div className="header-actions">
          <button className="notification-btn">🔔</button>

          <button className="add-expense-btn">
            + Add Expense
          </button>
        </div>
      </header>

      {/* Statistics */}
      <section className="stats-grid">

        <div className="stat-card balance-card">
          <div className="stat-top">
            <div>
              <p>Total Balance</p>
              <h2>₹8,450</h2>
            </div>

            <div className="stat-icon">₹</div>
          </div>

          <div className="stat-footer positive">
            ↑ 12.5% <span>from last month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div>
              <p>This Month</p>
              <h2>₹3,240</h2>
            </div>

            <div className="stat-icon blue-icon">↗</div>
          </div>

          <div className="stat-footer">
            <span>18 transactions</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div>
              <p>Monthly Budget</p>
              <h2>₹10,000</h2>
            </div>

            <div className="stat-icon purple-icon">◈</div>
          </div>

          <div className="budget-progress">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>

            <span>32% used</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div>
              <p>You Owe</p>
              <h2>₹680</h2>
            </div>

            <div className="stat-icon orange-icon">↗</div>
          </div>

          <div className="stat-footer warning">
            2 pending settlements
          </div>
        </div>

      </section>

      {/* Main Content */}
      <section className="dashboard-content">

        {/* Spending Overview */}
        <div className="dashboard-card spending-card">

          <div className="card-header">
            <div>
              <h2>Spending Overview</h2>
              <p>Your spending activity over the last 7 days</p>
            </div>

            <select className="period-select">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This year</option>
            </select>
          </div>

          <div className="chart">

            <div className="chart-y-axis">
              <span>₹1,000</span>
              <span>₹750</span>
              <span>₹500</span>
              <span>₹250</span>
              <span>₹0</span>
            </div>

            <div className="chart-area">

              <div className="chart-grid-line"></div>
              <div className="chart-grid-line"></div>
              <div className="chart-grid-line"></div>
              <div className="chart-grid-line"></div>

              <div className="bars">

                <div className="bar-column">
                  <div className="bar" style={{ height: "35%" }}></div>
                  <span>Mon</span>
                </div>

                <div className="bar-column">
                  <div className="bar" style={{ height: "55%" }}></div>
                  <span>Tue</span>
                </div>

                <div className="bar-column">
                  <div className="bar" style={{ height: "42%" }}></div>
                  <span>Wed</span>
                </div>

                <div className="bar-column">
                  <div className="bar" style={{ height: "75%" }}></div>
                  <span>Thu</span>
                </div>

                <div className="bar-column">
                  <div className="bar" style={{ height: "48%" }}></div>
                  <span>Fri</span>
                </div>

                <div className="bar-column">
                  <div className="bar" style={{ height: "85%" }}></div>
                  <span>Sat</span>
                </div>

                <div className="bar-column">
                  <div className="bar today" style={{ height: "62%" }}></div>
                  <span>Sun</span>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="dashboard-card recent-card">

          <div className="card-header">
            <div>
              <h2>Recent Expenses</h2>
              <p>Your latest transactions</p>
            </div>

            <button className="view-all">View all →</button>
          </div>

          <div className="expense-list">

            <div className="expense">
              <div className="expense-left">
                <div className="expense-icon food">🍔</div>

                <div>
                  <strong>Food & Dining</strong>
                  <span>Today, 12:30 PM</span>
                </div>
              </div>

              <div className="expense-amount">
                -₹250
              </div>
            </div>

            <div className="expense">
              <div className="expense-left">
                <div className="expense-icon travel">🚌</div>

                <div>
                  <strong>Transportation</strong>
                  <span>Yesterday, 08:45 AM</span>
                </div>
              </div>

              <div className="expense-amount">
                -₹120
              </div>
            </div>

            <div className="expense">
              <div className="expense-left">
                <div className="expense-icon shopping">🛍️</div>

                <div>
                  <strong>Shopping</strong>
                  <span>Oct 6, 06:20 PM</span>
                </div>
              </div>

              <div className="expense-amount">
                -₹850
              </div>
            </div>

            <div className="expense">
              <div className="expense-left">
                <div className="expense-icon entertainment">🎬</div>

                <div>
                  <strong>Entertainment</strong>
                  <span>Oct 5, 09:10 PM</span>
                </div>
              </div>

              <div className="expense-amount">
                -₹320
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* Bottom Section */}
      <section className="bottom-grid">

        {/* Budget */}
        <div className="dashboard-card budget-card">

          <div className="card-header">
            <div>
              <h2>Budget Status</h2>
              <p>October 2026</p>
            </div>

            <button className="view-all">Manage →</button>
          </div>

          <div className="budget-item">
            <div className="budget-info">
              <span>🍔 Food</span>
              <strong>₹1,250 / ₹3,000</strong>
            </div>

            <div className="budget-track">
              <div
                className="budget-value food-budget"
                style={{ width: "42%" }}
              ></div>
            </div>
          </div>

          <div className="budget-item">
            <div className="budget-info">
              <span>🚌 Transport</span>
              <strong>₹680 / ₹2,000</strong>
            </div>

            <div className="budget-track">
              <div
                className="budget-value transport-budget"
                style={{ width: "34%" }}
              ></div>
            </div>
          </div>

          <div className="budget-item">
            <div className="budget-info">
              <span>🛍️ Shopping</span>
              <strong>₹1,310 / ₹2,500</strong>
            </div>

            <div className="budget-track">
              <div
                className="budget-value shopping-budget"
                style={{ width: "52%" }}
              ></div>
            </div>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="dashboard-card quick-card">

          <div className="card-header">
            <div>
              <h2>Quick Actions</h2>
              <p>Manage your expenses faster</p>
            </div>
          </div>

          <div className="quick-actions">

            <button className="quick-action">
              <span>💸</span>
              <div>
                <strong>Add Expense</strong>
                <small>Record a new expense</small>
              </div>
            </button>

            <button className="quick-action">
              <span>👥</span>
              <div>
                <strong>Create Group</strong>
                <small>Split expenses with friends</small>
              </div>
            </button>

            <button className="quick-action">
              <span>💰</span>
              <div>
                <strong>Set Budget</strong>
                <small>Create a monthly budget</small>
              </div>
            </button>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Dashboard;