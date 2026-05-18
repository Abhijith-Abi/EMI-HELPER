# Requirements Document

## Introduction

The AI Debt Recovery & Financial Stability System is a comprehensive feature set for Cash ERP that transforms the existing personal finance app into an intelligent financial recovery platform. It provides AI-powered debt prediction, strategy comparison, smart EMI optimization, salary survival analysis, emergency financial modes, expense intelligence, health scoring, coaching, side income planning, subscription detection, forecasting, goal-based planning, psychological motivation, calendar reminders, reports, gamification, and predictive warnings. All computations run client-side using the existing Zustand store data (EMIs, expenses, goals, salary) with results persisted to Firebase RTDB.

## Glossary

- **Recovery_Engine**: The core computation module that calculates debt payoff timelines, strategy comparisons, and financial projections using user EMI, expense, and salary data
- **Strategy_Comparator**: The module that computes and compares Snowball (lowest balance first) and Avalanche (highest interest first) debt repayment strategies
- **EMI_Optimizer**: The module that analyzes EMI load distribution, detects dangerous debt patterns, and recommends restructuring opportunities
- **Survival_Engine**: The module that calculates how long salary lasts given expenses and EMIs, and provides daily/weekly spending limits
- **Emergency_Controller**: The module that detects critical financial states (EMI exceeds salary, negative balance) and activates emergency mode restrictions
- **Expense_Analyzer**: The module that detects spending patterns, overspending habits, recurring waste, and hidden money leaks
- **Health_Scorer**: The module that computes a composite financial health score from savings ratio, EMI ratio, expense stability, debt level, and emergency fund status
- **Recovery_Coach**: The module that generates daily personalized financial advice, recovery milestones, and motivational messages
- **Forecast_Engine**: The module that projects financial state over the next 12 months including balance, savings growth, and loan completion dates
- **Gamification_Engine**: The module that tracks XP points, levels, streaks, achievements, and challenges for financial discipline
- **Warning_Engine**: The module that predicts future financial risks including EMI failure probability, cash shortage, and burnout risk
- **Financial_Risk_Level**: A classification of financial health as Safe (EMI < 30% salary), Moderate (30-45%), High_Risk (45-60%), or Critical (> 60%)
- **Survival_Score**: A percentage representing the probability of salary lasting the full month given current spending patterns
- **Health_Score**: A composite score from 0-100 derived from savings ratio, EMI ratio, expense stability, debt level, and emergency fund adequacy
- **Snowball_Strategy**: Debt repayment method that prioritizes paying off the smallest balance first while making minimum payments on others
- **Avalanche_Strategy**: Debt repayment method that prioritizes paying off the highest interest rate debt first while making minimum payments on others
- **EMI_Pressure_Index**: A per-EMI metric indicating how much financial strain each loan causes relative to income
- **Side_Income**: Additional income from freelance work, side hustles, or secondary employment tracked separately from primary salary
- **XP_Points**: Experience points earned through financial discipline actions such as saving money, maintaining streaks, and completing challenges

## Requirements

### Requirement 1: Debt Recovery Prediction

**User Story:** As a user, I want to see an AI-predicted debt-free date with a detailed payoff timeline, so that I can understand exactly when I will be debt-free and track my progress.

#### Acceptance Criteria

1. WHEN the user navigates to the Recovery Dashboard, THE Recovery_Engine SHALL calculate and display the predicted debt-free month and year based on active EMIs and their remaining months
2. WHEN active EMIs exist, THE Recovery_Engine SHALL compute total remaining debt as the sum of (emi_amount × remaining_months) for each active EMI
3. WHEN active EMIs exist, THE Recovery_Engine SHALL compute total interest paid over the loan lifetime using each EMI interest_rate and remaining principal
4. THE Recovery_Engine SHALL classify the user Financial_Risk_Level as Safe when total EMI is below 30% of salary, Moderate when between 30-45%, High_Risk when between 45-60%, and Critical when above 60%
5. WHEN the user has a salary configured, THE Recovery_Engine SHALL calculate a monthly Survival_Score as a percentage representing the ratio of remaining funds to salary after EMIs and expenses
6. THE Recovery_Engine SHALL display a debt-free countdown showing remaining months and days until the predicted debt-free date
7. WHEN projection data is available, THE Recovery_Engine SHALL render a progress ring showing percentage of total debt already paid off
8. WHEN projection data is available, THE Recovery_Engine SHALL render a timeline roadmap showing each EMI completion milestone in chronological order
9. WHEN projection data is available, THE Recovery_Engine SHALL render an interactive payoff graph showing debt reduction over time using Recharts AreaChart
10. WHEN projection data is available, THE Recovery_Engine SHALL render a monthly cashflow chart showing income, EMI outflow, expenses, and net savings per month
11. WHEN all calculations complete, THE Recovery_Engine SHALL generate a natural language AI insight summarizing the debt-free timeline (e.g., "You will become debt free in 11 months")

### Requirement 2: Snowball vs Avalanche Strategy Comparison

**User Story:** As a user, I want to compare Snowball and Avalanche repayment strategies side-by-side, so that I can choose the approach that saves me the most money or gets me debt-free fastest.

#### Acceptance Criteria

1. WHEN the user has two or more active EMIs, THE Strategy_Comparator SHALL compute the total interest paid and payoff timeline for the Snowball_Strategy
2. WHEN the user has two or more active EMIs, THE Strategy_Comparator SHALL compute the total interest paid and payoff timeline for the Avalanche_Strategy
3. WHEN both strategies are computed, THE Strategy_Comparator SHALL display a side-by-side comparison showing total interest paid, total months to debt-free, and money saved for each strategy
4. WHEN both strategies are computed, THE Strategy_Comparator SHALL render a visual timeline comparison chart showing debt reduction curves for both strategies
5. WHEN both strategies are computed, THE Strategy_Comparator SHALL automatically recommend the strategy that results in lower total interest paid, with a clear label indicating the recommended option
6. IF the user has fewer than two active EMIs, THEN THE Strategy_Comparator SHALL display a message indicating that strategy comparison requires at least two active loans

### Requirement 3: Smart EMI Optimization

**User Story:** As a user, I want the system to analyze my EMI portfolio and suggest optimizations, so that I can reduce unnecessary loan burden and pay off debt more efficiently.

#### Acceptance Criteria

1. WHEN the user has active EMIs, THE EMI_Optimizer SHALL calculate an EMI_Pressure_Index for each loan based on its EMI amount relative to salary and its interest rate
2. WHEN analyzing EMIs, THE EMI_Optimizer SHALL identify loans where early closure (using available savings) would result in net interest savings exceeding 5% of the remaining loan cost
3. WHEN analyzing EMIs, THE EMI_Optimizer SHALL detect dangerous debt patterns where total EMI exceeds 50% of salary and flag them with a warning
4. WHEN multiple EMIs exist, THE EMI_Optimizer SHALL rank EMIs by pressure index and recommend the optimal payment order to minimize total interest
5. WHEN analyzing EMIs, THE EMI_Optimizer SHALL highlight the single EMI that causes the most financial pressure based on the highest EMI_Pressure_Index value
6. IF any EMI has an interest rate exceeding 15%, THEN THE EMI_Optimizer SHALL suggest loan restructuring or refinancing for that specific EMI

### Requirement 4: Salary Survival Analysis

**User Story:** As a user, I want to know how many days my salary will last and get daily spending limits, so that I can budget effectively throughout the month.

#### Acceptance Criteria

1. WHEN the user has salary and expense data, THE Survival_Engine SHALL predict the number of days the salary will last based on average daily spending rate calculated from current month expenses
2. WHEN the user has salary data, THE Survival_Engine SHALL calculate a daily spending limit as (salary - total_monthly_EMI) divided by days remaining in the current month
3. WHEN the user has salary data, THE Survival_Engine SHALL calculate a weekly safe spending recommendation as the daily spending limit multiplied by 7
4. THE Survival_Engine SHALL display a survival probability meter showing the Survival_Score as a percentage gauge from 0% to 100%
5. WHILE the Survival_Score is below 40%, THE Survival_Engine SHALL display an emergency budget mode recommendation with reduced spending targets

### Requirement 5: Emergency Financial Mode

**User Story:** As a user, I want the system to automatically detect critical financial situations and activate emergency mode, so that I receive immediate guidance when my finances are in danger.

#### Acceptance Criteria

1. WHEN total monthly EMI exceeds the user salary, THE Emergency_Controller SHALL activate emergency mode and display a red alert banner across the dashboard
2. WHEN the user monthly balance (salary minus EMIs minus expenses) is negative, THE Emergency_Controller SHALL activate emergency mode
3. WHILE emergency mode is active, THE Emergency_Controller SHALL display an essential-only spending recommendation that categorizes expenses as essential or non-essential
4. WHILE emergency mode is active, THE Emergency_Controller SHALL generate a cost-cutting plan with specific actionable suggestions based on the user expense categories
5. WHEN emergency mode activates, THE Emergency_Controller SHALL send a notification to the user via the existing notification system alerting them of the critical financial state
6. WHEN the user financial state returns to positive balance and EMI is below salary, THE Emergency_Controller SHALL deactivate emergency mode and remove the alert banner

### Requirement 6: Smart Expense Intelligence

**User Story:** As a user, I want the system to analyze my spending patterns and detect money leaks, so that I can identify and eliminate wasteful spending.

#### Acceptance Criteria

1. WHEN the user has at least 10 expense entries, THE Expense_Analyzer SHALL detect overspending habits by identifying categories where spending exceeds 120% of the user 4-week rolling average
2. WHEN the user has recurring expenses, THE Expense_Analyzer SHALL identify hidden money leaks by detecting repeated small expenses in the same category that collectively exceed 10% of salary
3. WHEN sufficient expense data exists (at least 4 weeks), THE Expense_Analyzer SHALL generate a weekly spending pattern analysis showing spending distribution by day of week
4. THE Expense_Analyzer SHALL compute a spending behavior score from 0-100 based on consistency of spending relative to budget limits, with higher scores indicating more disciplined spending

### Requirement 7: Financial Health Score

**User Story:** As a user, I want a single composite health score that reflects my overall financial wellness, so that I can quickly understand my financial standing.

#### Acceptance Criteria

1. THE Health_Scorer SHALL compute a Health_Score from 0-100 using weighted factors: savings ratio (25%), EMI ratio (25%), expense stability (20%), debt level (15%), and emergency fund adequacy (15%)
2. THE Health_Scorer SHALL classify the Health_Score into categories: Excellent (80-100), Stable (60-79), Warning (40-59), and Dangerous (0-39)
3. THE Health_Scorer SHALL display the score using a circular score meter with color coding: green for Excellent, blue for Stable, amber for Warning, and red for Dangerous
4. WHEN any input factor changes (new expense, EMI update, salary change), THE Health_Scorer SHALL recalculate the Health_Score within the same render cycle
5. THE Health_Scorer SHALL display a breakdown showing each factor contribution to the total score with individual sub-scores

### Requirement 8: AI Recovery Coach

**User Story:** As a user, I want personalized daily financial advice and motivation, so that I stay on track with my debt recovery journey.

#### Acceptance Criteria

1. WHEN the user opens the Recovery Coach section, THE Recovery_Coach SHALL generate contextual financial advice based on current EMI burden, spending patterns, and savings rate
2. THE Recovery_Coach SHALL define recovery milestones at 25%, 50%, 75%, and 100% of total debt paid off, and display achieved milestones with celebration indicators
3. WHEN the user spending in any category exceeds 150% of their monthly average for that category, THE Recovery_Coach SHALL generate a spending warning for that category
4. THE Recovery_Coach SHALL provide personalized suggestions based on the user specific financial data including which EMI to prioritize, where to cut spending, and how to increase savings
5. WHEN a milestone is achieved, THE Recovery_Coach SHALL display a motivational message and add a notification via the existing notification system

### Requirement 9: Side Income Planning

**User Story:** As a user, I want to track side income and see how it accelerates my debt recovery, so that I can plan additional income sources effectively.

#### Acceptance Criteria

1. WHEN the user adds a Side_Income entry, THE Recovery_Engine SHALL recalculate the debt-free date incorporating the additional income into monthly available funds
2. THE Recovery_Engine SHALL display the difference in debt-free timeline between salary-only and salary-plus-side-income scenarios
3. THE Recovery_Engine SHALL allow the user to add, edit, and delete Side_Income entries with fields for title, monthly amount, and start date
4. WHEN side income entries exist, THE Recovery_Engine SHALL display total monthly side income and its percentage contribution to debt repayment

### Requirement 10: Subscription and Waste Detection

**User Story:** As a user, I want the system to detect recurring unnecessary expenses and show total monthly waste, so that I can cancel subscriptions I no longer need.

#### Acceptance Criteria

1. WHEN the user has expense history spanning at least 2 months, THE Expense_Analyzer SHALL detect recurring expenses by identifying expenses with similar titles and amounts appearing in consecutive months
2. WHEN recurring expenses are detected, THE Expense_Analyzer SHALL calculate and display the total monthly waste amount from all identified recurring non-essential expenses
3. WHEN recurring expenses are detected, THE Expense_Analyzer SHALL suggest specific cancellations with the estimated monthly and annual savings for each
4. THE Expense_Analyzer SHALL categorize detected recurring expenses as essential (rent, utilities, insurance) or non-essential (entertainment, subscriptions, luxury) based on expense category

### Requirement 11: Future Financial Forecasting

**User Story:** As a user, I want to see a 12-month financial forecast, so that I can plan ahead and anticipate my financial trajectory.

#### Acceptance Criteria

1. THE Forecast_Engine SHALL project the user bank balance for each of the next 12 months based on current salary, EMI schedule, and average monthly expenses
2. THE Forecast_Engine SHALL forecast cumulative savings growth over the next 12 months accounting for EMI completions that free up monthly cash flow
3. THE Forecast_Engine SHALL predict the month when each active EMI will complete and show the resulting increase in available monthly funds
4. THE Forecast_Engine SHALL render a 12-month forecast chart showing projected balance, savings, and debt trajectories using Recharts LineChart
5. IF projected balance goes negative in any future month, THEN THE Forecast_Engine SHALL flag that month with a warning indicator on the forecast chart

### Requirement 12: Goal-Based Recovery Planning

**User Story:** As a user, I want to set financial goals (emergency fund, vehicle, home) and get goal-based budgeting recommendations, so that I can work toward specific targets while managing debt.

#### Acceptance Criteria

1. WHEN the user creates a goal, THE Recovery_Engine SHALL calculate the required monthly contribution to reach the goal target_amount by the deadline
2. WHEN goals exist alongside active EMIs, THE Recovery_Engine SHALL display a priority-ordered plan showing recommended allocation of available funds across debt repayment and goal savings
3. THE Recovery_Engine SHALL calculate and display the feasibility of each goal given current income, EMI obligations, and expenses, marking goals as On Track, At Risk, or Unreachable
4. WHEN a goal monthly contribution combined with EMI payments exceeds 70% of salary, THE Recovery_Engine SHALL warn the user that the goal timeline may need extension

### Requirement 13: Psychological Motivation System

**User Story:** As a user, I want streak tracking, challenges, and achievement badges, so that I stay motivated to maintain financial discipline.

#### Acceptance Criteria

1. THE Gamification_Engine SHALL track consecutive days where the user daily spending remains below the calculated daily spending limit, displayed as a streak counter
2. THE Gamification_Engine SHALL offer a no-spend challenge mode where the user commits to zero non-essential spending for a configurable number of days (1, 3, 7, or 30)
3. WHEN the user reaches a recovery milestone (25%, 50%, 75%, 100% debt paid), THE Gamification_Engine SHALL award an achievement badge with a title and description
4. THE Gamification_Engine SHALL persist streak data, challenge progress, and earned badges to the Zustand store with Firebase RTDB sync
5. WHEN a streak is broken, THE Gamification_Engine SHALL display the previous streak length and encourage the user to start a new streak

### Requirement 14: Calendar and Reminder System

**User Story:** As a user, I want a calendar view showing EMI due dates, salary days, and bill reminders, so that I never miss a payment.

#### Acceptance Criteria

1. THE Recovery_Engine SHALL display a monthly calendar view highlighting EMI due dates extracted from each EMI due_date field
2. WHEN the user has configured a salary day in settings, THE Recovery_Engine SHALL highlight the salary credit date on the calendar
3. WHEN an EMI due date is within 3 days, THE Recovery_Engine SHALL trigger a reminder notification via the existing notification system
4. THE Recovery_Engine SHALL allow the user to add custom bill reminders with title, amount, and due date that appear on the calendar
5. THE Recovery_Engine SHALL display upcoming payments for the next 7 days in a summary list sorted by due date

### Requirement 15: Reports and Analytics

**User Story:** As a user, I want comprehensive monthly financial reports, so that I can review my financial progress over time.

#### Acceptance Criteria

1. WHEN the user requests a monthly report, THE Recovery_Engine SHALL generate a financial summary including total income, total EMI paid, total expenses, net savings, and month-over-month change
2. THE Recovery_Engine SHALL generate a debt report showing total debt reduction for the selected month, EMIs completed, and remaining debt balance
3. THE Recovery_Engine SHALL generate an expense report with category-wise breakdown, top spending categories, and comparison to previous month
4. THE Recovery_Engine SHALL generate a savings report showing savings rate, cumulative savings, and progress toward savings goals
5. THE Recovery_Engine SHALL allow the user to select any previous month for report generation from available expense and EMI history

### Requirement 16: Gamified Recovery System

**User Story:** As a user, I want to earn XP points and level up for good financial behavior, so that debt recovery feels rewarding and engaging.

#### Acceptance Criteria

1. WHEN the user completes a day under the daily spending limit, THE Gamification_Engine SHALL award 10 XP_Points
2. WHEN the user maintains a 7-day spending streak, THE Gamification_Engine SHALL award a bonus of 50 XP_Points
3. THE Gamification_Engine SHALL define levels where each level requires progressively more XP_Points: Level 1 (0 XP), Level 2 (100 XP), Level 3 (300 XP), Level 4 (600 XP), Level 5 (1000 XP), and subsequent levels at 500 XP increments
4. WHEN the user levels up, THE Gamification_Engine SHALL display a level-up celebration animation using Framer Motion and send a notification
5. THE Gamification_Engine SHALL display current XP, current level, and progress toward next level in a persistent status indicator

### Requirement 17: AI Predictive Warning Engine

**User Story:** As a user, I want early warnings about potential financial problems, so that I can take preventive action before a crisis occurs.

#### Acceptance Criteria

1. WHEN the user spending trend for the current month projects total expenses exceeding salary minus EMIs, THE Warning_Engine SHALL generate an overspending risk warning with the projected shortfall amount
2. WHEN the user has an EMI due within 7 days and projected available balance on that date is below the EMI amount, THE Warning_Engine SHALL generate an EMI failure prediction warning
3. WHEN the user average daily spending rate multiplied by remaining days in month exceeds available funds, THE Warning_Engine SHALL generate a cash shortage warning
4. THE Warning_Engine SHALL compute a financial burnout risk score based on consecutive months where savings rate is below 5%, and generate a burnout warning when the score exceeds 3 consecutive months
5. WHEN any warning is generated, THE Warning_Engine SHALL assign a severity level (Low, Medium, High, Critical) and display warnings sorted by severity in descending order
6. WHEN a Critical severity warning is generated, THE Warning_Engine SHALL send an immediate notification via the existing notification system
