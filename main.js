lucide.createIcons();

// Function to load transactions from local storage
const loadTransactionsFromLocalStorage = () => {
    try {
        const storedData = localStorage.getItem('financeTransactions');
        return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
        console.error("Error loading transactions from local storage:", error);
        return []; // Return empty array if there's an error parsing
    }
};

// Function to save transactions to local storage
const saveTransactionsToLocalStorage = () => {
    try {
        localStorage.setItem('financeTransactions', JSON.stringify(transactionsData));
    } catch (error) {
        console.error("Error saving transactions to local storage:", error);
    }
};

// Function to load categories from local storage
const loadCategoriesFromLocalStorage = () => {
    try {
        const storedData = localStorage.getItem('financeCategories');
        return storedData ? JSON.parse(storedData) : [
            "Salary", "Rent", "Food", "Transport", "Entertainment", "Utilities", "Shopping", "Healthcare", "Other"
        ];
    } catch (error) {
        console.error("Error loading categories from local storage:", error);
        return [];
    }
};

// Function to save categories to local storage
const saveCategoriesToLocalStorage = () => {
    try {
        localStorage.setItem('financeCategories', JSON.stringify(categories));
    } catch (error) {
        console.error("Error saving categories to local storage:", error);
    }
};

// Function to load budget from local storage
const loadBudgetFromLocalStorage = () => {
    try {
        const storedData = localStorage.getItem('financeBudget');
        return storedData ? JSON.parse(storedData) : { amount: 3500, goal: 1250 };
    } catch (error) {
        console.error("Error loading budget from local storage:", error);
        return { amount: 3500, goal: 1250 };
    }
};

// Function to save budget to local storage
const saveBudgetToLocalStorage = () => {
    try {
        localStorage.setItem('financeBudget', JSON.stringify(budget));
    } catch (error) {
        console.error("Error saving budget to local storage:", error);
    }
};

// Function to load settings from local storage
const loadSettingsFromLocalStorage = () => {
    try {
        const storedData = localStorage.getItem('financeSettings');
        return storedData ? JSON.parse(storedData) : { currency: 'USD', theme: 'dark' };
    } catch (error) {
        console.error("Error loading settings from local storage:", error);
        return { currency: 'USD', theme: 'dark' };
    }
};

// Function to save settings to local storage
const saveSettingsToLocalStorage = () => {
    try {
        localStorage.setItem('financeSettings', JSON.stringify(settings));
    } catch (error) {
        console.error("Error saving settings to local storage:", error);
    }
};

// Initialize data
let transactionsData = loadTransactionsFromLocalStorage();
let categories = loadCategoriesFromLocalStorage();
let budget = loadBudgetFromLocalStorage();
let settings = loadSettingsFromLocalStorage();

const financialTips = [
    "Create a budget and stick to it to gain control over your spending.",
    "Set clear financial goals, whether it's saving for a down payment or retirement.",
    "Automate your savings by setting up regular transfers to a separate savings account.",
    "Review your bank statements regularly to catch errors and track spending.",
    "Pay off high-interest debt first to save money on interest payments.",
    "Build an emergency fund covering 3-6 months of living expenses.",
    "Invest in yourself through education or skills development to boost your earning potential.",
    "Diversify your investments to minimize risk and maximize returns.",
    "Consider consulting a financial advisor for personalized guidance.",
    "Track all your expenses to identify areas where you can cut back."
];

// Pagination variables
let currentPage = 1;
const transactionsPerPage = 5;
let currentSortColumn = 'date';
let currentSortDirection = 'desc';
let filteredTransactions = [...transactionsData];
let dateFilterActive = false;

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: settings.currency || 'USD'
    }).format(amount);
};

const showToast = (message, isSuccess = true) => {
    const toast = document.createElement('div');
    toast.className = `toast ${isSuccess ? 'bg-green-600' : 'bg-red-600'}`;
    toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check">
            <path d="M20 6 9 17l-5-5"/>
        </svg>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
};

const showAlert = (message) => {
    document.getElementById('customAlertMessage').textContent = message;
    document.getElementById('customAlertModal').style.display = 'flex';
};

const showLoading = () => {
    document.getElementById('loadingOverlay').style.display = 'flex';
};

const hideLoading = () => {
    document.getElementById('loadingOverlay').style.display = 'none';
};

const updateSummaryCards = () => {
    let totalIncome = 0;
    let totalExpenses = 0;

    const transactionsToUse = dateFilterActive ? filteredTransactions : transactionsData;

    transactionsToUse.forEach(t => {
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else {
            totalExpenses += t.amount;
        }
    });

    const netSavings = totalIncome - totalExpenses;
    const budgetProgress = Math.min(100, (totalExpenses / budget.amount) * 100);
    const savingsProgress = Math.min(100, (netSavings / budget.goal) * 100);

    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('net-savings').textContent = formatCurrency(netSavings);
    document.getElementById('savings-spending-total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('monthly-budget').textContent = formatCurrency(budget.amount);
    document.getElementById('savings-goal').textContent = formatCurrency(budget.goal);

    document.getElementById('budget-progress').style.width = `${budgetProgress}%`;
    document.getElementById('savings-progress').style.width = `${savingsProgress}%`;

    // Use dedicated elements for progress text
    const budgetSpentText = document.getElementById('budget-spent-text');
    if (budgetSpentText) {
        budgetSpentText.textContent = 
            `${formatCurrency(totalExpenses)} of ${formatCurrency(budget.amount)} spent`;
    }
    const savingsProgressText = document.getElementById('savings-progress-text');
    if (savingsProgressText) {
        savingsProgressText.textContent = 
            `${formatCurrency(Math.min(netSavings, budget.goal))} saved of ${formatCurrency(budget.goal)} goal`;
    }
};

const populateTransactionsTable = () => {
    const tableBody = document.getElementById('transactions-table-body');
    tableBody.innerHTML = '';

    // Determine which transactions to use
    const transactionsToUse = dateFilterActive ? filteredTransactions : transactionsData;
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = Math.min(startIndex + transactionsPerPage, transactionsToUse.length);
    const paginatedTransactions = transactionsToUse.slice(startIndex, endIndex);
    
    // Update pagination info
    document.getElementById('pagination-info').textContent = 
        `Showing ${startIndex + 1}-${endIndex} of ${transactionsToUse.length} transactions`;
    
    // Enable/disable pagination buttons
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = endIndex >= transactionsToUse.length;

    // Sort transactions
    const sortedData = [...paginatedTransactions].sort((a, b) => {
        let valA, valB;

        if (currentSortColumn === 'date') {
            valA = new Date(a.date);
            valB = new Date(b.date);
        } else if (currentSortColumn === 'amount') {
            valA = a.amount;
            valB = b.amount;
            // For amount, expenses should be treated as negative for sorting purposes
            if (a.type === 'expense') valA = -valA;
            if (b.type === 'expense') valB = -valB;
        } else if (currentSortColumn === 'category') {
            valA = a.category.toLowerCase();
            valB = b.category.toLowerCase();
        } else { // type
            valA = a.type;
            valB = b.type;
        }

        if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    sortedData.forEach(t => {
        const row = document.createElement('tr');
        row.classList.add('hover:bg-gray-700', 'transition-colors', 'duration-200');

        const amountClass = t.type === 'income' ? 'text-green-400' : 'text-red-400';
        const typeClass = t.type === 'income' ? 'transaction-type-income' : 'transaction-type-expense';
        const sign = t.type === 'income' ? '+' : '-';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">${t.date}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${t.category}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="${typeClass}">${t.type.charAt(0).toUpperCase() + t.type.slice(1)}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm ${amountClass}">${sign}${formatCurrency(t.amount)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button class="edit-btn text-blue-400 hover:text-blue-300" data-id="${t.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
                <button class="delete-btn text-red-400 hover:text-red-300" data-id="${t.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            editTransaction(id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            deleteTransaction(id);
        });
    });
};

// Chart.js configurations
let savingsSpendingChart, incomeExpenseChart, expenseBreakdownChart, balanceOverTimeChart;

const renderCharts = () => {
    // Destroy existing charts if they exist to prevent duplicates
    if (savingsSpendingChart) savingsSpendingChart.destroy();
    if (incomeExpenseChart) incomeExpenseChart.destroy();
    if (expenseBreakdownChart) expenseBreakdownChart.destroy();
    if (balanceOverTimeChart) balanceOverTimeChart.destroy();

    // Determine which transactions to use
    const transactionsToUse = dateFilterActive ? filteredTransactions : transactionsData;
    
    // Savings vs. Spending Chart (Donut)
    const income = transactionsToUse.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactionsToUse.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const savingsSpendingCtx = document.getElementById('savingsSpendingChart').getContext('2d');
    savingsSpendingChart = new Chart(savingsSpendingCtx, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [income, expenses],
                backgroundColor: ['#22c55e', '#ef4444'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e2e8f0',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += formatCurrency(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    // Income vs. Expense Chart (Bar)
    // Group transactions by date for the bar chart
    const dailySummary = transactionsToUse.reduce((acc, t) => {
        const date = t.date.split(',')[0].trim(); // Get 'Jul 30'
        if (!acc[date]) {
            acc[date] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            acc[date].income += t.amount;
        } else {
            acc[date].expense += t.amount;
        }
        return acc;
    }, {});

    const dates = Object.keys(dailySummary).sort((a, b) => new Date(a + ', 2025') - new Date(b + ', 2025'));
    const dailyIncome = dates.map(date => dailySummary[date].income);
    const dailyExpense = dates.map(date => dailySummary[date].expense);

    const incomeExpenseCtx = document.getElementById('incomeExpenseChart').getContext('2d');
    incomeExpenseChart = new Chart(incomeExpenseCtx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Income',
                    data: dailyIncome,
                    backgroundColor: '#22c55e',
                    borderRadius: 4
                },
                {
                    label: 'Expense',
                    data: dailyExpense,
                    backgroundColor: '#ef4444',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: false,
                    grid: {
                        color: '#4a5568'
                    },
                    ticks: {
                        color: '#e2e8f0',
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 10
                    }
                },
                y: { // <-- FIXED: Added missing curly brace
                    stacked: false,
                    beginAtZero: true,
                    grid: {
                        color: '#4a5568'
                    },
                    ticks: {
                        color: '#e2e8f0',
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e2e8f0'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    // Expense Breakdown Chart (Donut)
    const expenseCategories = transactionsToUse
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

    const expenseLabels = Object.keys(expenseCategories);
    const expenseAmounts = Object.values(expenseCategories);
    const totalExpense = expenseAmounts.reduce((sum, amount) => sum + amount, 0);
    const expensePercentages = expenseAmounts.map(amount => ((amount / totalExpense) * 100).toFixed(0) + '%');

    const expenseBreakdownCtx = document.getElementById('expenseBreakdownChart').getContext('2d');
    expenseBreakdownChart = new Chart(expenseBreakdownCtx, {
        type: 'doughnut',
        data: {
            labels: expenseLabels,
            datasets: [{
                data: expenseAmounts,
                backgroundColor: ['#fcd34d', '#3b82f6', '#a78bfa', '#ef4444', '#10b981', '#f97316'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e2e8f0',
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += formatCurrency(context.parsed) + ` (${expensePercentages[context.dataIndex]})`;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    // Balance Over Time Chart (Line)
    const balanceHistory = [];
    let currentBalance = 0;
    // Sort transactions by date ascending for correct balance calculation
    const sortedTransactionsForBalance = [...transactionsToUse].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedTransactionsForBalance.forEach(t => {
        if (t.type === 'income') {
            currentBalance += t.amount;
        } else {
            currentBalance -= t.amount;
        }
        balanceHistory.push({ date: t.date, balance: currentBalance });
    });

    const balanceDates = balanceHistory.map(item => item.date.split(',')[0].trim());
    const balances = balanceHistory.map(item => item.balance);

    const balanceOverTimeCtx = document.getElementById('balanceOverTimeChart').getContext('2d');
    balanceOverTimeChart = new Chart(balanceOverTimeCtx, {
        type: 'line',
        data: {
            labels: balanceDates,
            datasets: [{
                label: 'Balance',
                data: balances,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#22c55e',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#22c55e',
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        color: '#4a5568'
                    },
                    ticks: {
                        color: '#e2e8f0',
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 10
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        color: '#4a5568'
                    },
                    ticks: {
                        color: '#e2e8f0',
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e2e8f0'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
};

const editTransaction = (id) => {
    const transaction = transactionsData.find(t => t.id == id);
    if (!transaction) return;
    
    document.getElementById('transaction-modal-title').textContent = 'Edit Transaction';
    document.getElementById('transaction-id').value = transaction.id;
    document.getElementById('transactionDate').value = new Date(transaction.date).toISOString().split('T')[0];
    document.getElementById('transactionCategory').value = transaction.category;
    document.getElementById('transactionType').value = transaction.type;
    document.getElementById('transactionAmount').value = transaction.amount;
    document.getElementById('transactionDescription').value = transaction.description || '';
    
    document.getElementById('addTransactionModal').style.display = 'flex';
};

const deleteTransaction = (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    transactionsData = transactionsData.filter(t => t.id != id);
    saveTransactionsToLocalStorage();
    applyDateFilter(); // Reapply filter if active
    updateSummaryCards();
    populateTransactionsTable();
    renderCharts();
    showToast('Transaction deleted successfully!');
};

const applyDateFilter = () => {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        dateFilterActive = false;
        filteredTransactions = [...transactionsData];
        showAlert('Please select both start and end dates');
        return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
        showAlert('Start date cannot be after end date');
        return;
    }
    
    filteredTransactions = transactionsData.filter(t => {
        const transDate = new Date(t.date);
        return transDate >= start && transDate <= end;
    });
    
    dateFilterActive = true;
    currentPage = 1;
    updateSummaryCards();
    populateTransactionsTable();
    renderCharts();
    showToast(`Showing transactions from ${startDate} to ${endDate}`);
};

const resetDateFilter = () => {
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    dateFilterActive = false;
    filteredTransactions = [...transactionsData];
    currentPage = 1;
    updateSummaryCards();
    populateTransactionsTable();
    renderCharts();
    showToast('Showing all transactions');
};

const populateCategoryList = () => {
    const categoryList = document.getElementById('categories-list');
    categoryList.innerHTML = '';
    
    categories.forEach((category, index) => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
            <span class="text-gray-200">${category}</span>
            <div class="category-actions">
                <button class="category-edit text-xs" data-index="${index}">Edit</button>
                <button class="category-delete text-xs" data-index="${index}">Delete</button>
            </div>
        `;
        categoryList.appendChild(categoryItem);
    });
    
    // Add event listeners
    document.querySelectorAll('.category-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = btn.getAttribute('data-index');
            const newName = prompt('Enter new category name:', categories[index]);
            if (newName && newName.trim()) {
                categories[index] = newName.trim();
                saveCategoriesToLocalStorage();
                populateCategoryList();
                showToast('Category updated');
            }
        });
    });
    
    document.querySelectorAll('.category-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = btn.getAttribute('data-index');
            if (confirm(`Delete category "${categories[index]}"? Transactions in this category will be moved to "Other".`)) {
                // Update transactions with this category
                transactionsData.forEach(t => {
                    if (t.category === categories[index]) {
                        t.category = 'Other';
                    }
                });
                saveTransactionsToLocalStorage();
                
                // Remove category
                categories.splice(index, 1);
                saveCategoriesToLocalStorage();
                populateCategoryList();
                showToast('Category deleted');
            }
        });
    });
};

// Modal functionality
const addTransactionBtn = document.getElementById('add-transaction-btn');
const addTransactionModal = document.getElementById('addTransactionModal');
const closeModalBtn = document.querySelector('.close-button');
const transactionForm = document.getElementById('transactionForm');
const manageCategoriesBtn = document.getElementById('manage-categories-btn');
const categoryModal = document.getElementById('categoryModal');
const closeCategoryModalBtn = document.getElementById('close-category-modal');
const budgetModal = document.getElementById('budgetModal');
const closeBudgetModalBtn = document.getElementById('close-budget-modal');
const budgetForm = document.getElementById('budgetForm');
const editBudgetBtn = document.getElementById('edit-budget-btn');
const editGoalBtn = document.getElementById('edit-goal-btn');

addTransactionBtn.onclick = () => {
    document.getElementById('transaction-modal-title').textContent = 'Add New Transaction';
    document.getElementById('transaction-id').value = '';
    transactionForm.reset();
    addTransactionModal.style.display = 'flex';
};

closeModalBtn.onclick = () => {
    addTransactionModal.style.display = 'none';
};

manageCategoriesBtn.onclick = () => {
    populateCategoryList();
    categoryModal.style.display = 'flex';
};

closeCategoryModalBtn.onclick = () => {
    categoryModal.style.display = 'none';
};

editBudgetBtn.onclick = () => {
    document.getElementById('monthly-budget-input').value = budget.amount;
    document.getElementById('savings-goal-input').value = budget.goal;
    budgetModal.style.display = 'flex';
};

editGoalBtn.onclick = () => {
    document.getElementById('monthly-budget-input').value = budget.amount;
    document.getElementById('savings-goal-input').value = budget.goal;
    budgetModal.style.display = 'flex';
};

closeBudgetModalBtn.onclick = () => {
    budgetModal.style.display = 'none';
};

// Close modal if clicked outside of content
window.onclick = (event) => {
    if (event.target === addTransactionModal) {
        addTransactionModal.style.display = 'none';
    } else if (event.target === categoryModal) {
        categoryModal.style.display = 'none';
    } else if (event.target === budgetModal) {
        budgetModal.style.display = 'none';
    } else if (event.target === document.getElementById('customAlertModal')) {
        document.getElementById('customAlertModal').style.display = 'none';
    }
};

document.getElementById('customAlertCloseBtn').onclick = () => {
    document.getElementById('customAlertModal').style.display = 'none';
};

// Handle budget form submission
budgetForm.onsubmit = (e) => {
    e.preventDefault();
    
    const budgetAmount = parseFloat(document.getElementById('monthly-budget-input').value);
    const savingsGoal = parseFloat(document.getElementById('savings-goal-input').value);
    
    if (isNaN(budgetAmount)) {
        showAlert('Please enter a valid monthly budget');
        return;
    }
    
    if (isNaN(savingsGoal)) {
        showAlert('Please enter a valid savings goal');
        return;
    }
    
    budget = {
        amount: budgetAmount,
        goal: savingsGoal
    };
    
    saveBudgetToLocalStorage();
    budgetModal.style.display = 'none';
    updateSummaryCards();
    showToast('Budget and goals updated successfully!');
};

transactionForm.onsubmit = (event) => {
    event.preventDefault();

    const id = document.getElementById('transaction-id').value;
    const dateInput = document.getElementById('transactionDate').value;
    const category = document.getElementById('transactionCategory').value;
    const type = document.getElementById('transactionType').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const description = document.getElementById('transactionDescription').value;

    if (!dateInput || !category || isNaN(amount) || amount <= 0) {
        showAlert('Please fill in all fields with valid positive values.');
        return;
    }

    showLoading();

    try {
        const dateObj = new Date(dateInput);
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('en-US', options);

        if (id) {
            // Edit existing transaction
            const index = transactionsData.findIndex(t => t.id == id);
            if (index !== -1) {
                transactionsData[index] = {
                    ...transactionsData[index],
                    date: formattedDate,
                    category,
                    type,
                    amount,
                    description
                };
            }
        } else {
            // Add new transaction
            const newTransaction = {
                id: Date.now().toString(),
                date: formattedDate,
                category,
                type,
                amount,
                description
            };
            transactionsData.unshift(newTransaction);
        }
        
        saveTransactionsToLocalStorage();
        applyDateFilter(); // Reapply filter if active
        addTransactionModal.style.display = 'none';
        transactionForm.reset();

        updateSummaryCards();
        populateTransactionsTable();
        renderCharts();
        showToast(`Transaction ${id ? 'updated' : 'added'} successfully!`);
    } catch (error) {
        console.error('Error saving transaction:', error);
        showAlert('An error occurred while saving the transaction');
    } finally {
        hideLoading(); // FIX: Ensure spinner is always hidden
    }
};

// AI Financial Insights Refresh
document.getElementById('refresh-insights-btn').onclick = () => {
    const insightsContent = document.getElementById('ai-insights-content');
    const randomIndex = Math.floor(Math.random() * financialTips.length);
    insightsContent.textContent = financialTips[randomIndex];
};

// Export CSV Functionality
document.getElementById('export-csv-btn').onclick = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Category,Type,Amount,Description\n"; // CSV header

    transactionsData.forEach(t => {
        const row = `${t.date},${t.category},${t.type},${t.amount},"${t.description || ''}"`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "finance_transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV exported successfully');
};

document.getElementById('export-pdf-btn').onclick = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Table headers
    const headers = [["Date", "Category", "Type", "Amount", "Description"]];
    // Table rows
    const rows = transactionsData.map(t => [
        t.date,
        t.category,
        t.type,
        t.amount,
        t.description || ""
    ]);

    // Add title
    doc.setFontSize(16);
    doc.text("Finance Transactions", 14, 15);

    // Add table
    doc.autoTable({
        head: headers,
        body: rows,
        startY: 25,
        styles: { fontSize: 10 }
    });

    doc.save("finance_transactions.pdf");
    showToast('PDF exported successfully');
};

// Add new category
document.getElementById('add-category-btn').onclick = () => {
    const newCategory = document.getElementById('new-category-name').value.trim();
    if (!newCategory) {
        showAlert('Please enter a category name');
        return;
    }
    
    if (categories.includes(newCategory)) {
        showAlert('Category already exists');
        return;
    }
    
    categories.push(newCategory);
    saveCategoriesToLocalStorage();
    document.getElementById('new-category-name').value = '';
    populateCategoryList();
    showToast(`Category "${newCategory}" added`);
};

// Transaction Table Sorting
document.querySelectorAll('th[data-sort-by]').forEach(header => {
    header.addEventListener('click', () => {
        const sortBy = header.getAttribute('data-sort-by');
        if (currentSortColumn === sortBy) {
            currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortColumn = sortBy;
            currentSortDirection = 'asc';
        }
        populateTransactionsTable();
    });
});

// Pagination
document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        populateTransactionsTable();
    }
});

document.getElementById('next-page').addEventListener('click', () => {
    const transactionsToUse = dateFilterActive ? filteredTransactions : transactionsData;
    const totalPages = Math.ceil(transactionsToUse.length / transactionsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        populateTransactionsTable();
    }
});

// Search functionality
document.getElementById('transaction-search').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    if (!searchTerm) {
        filteredTransactions = [...transactionsData];
        dateFilterActive = false;
    } else {
        filteredTransactions = transactionsData.filter(t => 
            t.category.toLowerCase().includes(searchTerm) || 
            (t.description && t.description.toLowerCase().includes(searchTerm)) ||
            t.amount.toString().includes(searchTerm) ||
            t.type.toLowerCase().includes(searchTerm)
        );
        dateFilterActive = true;
    }
    
    currentPage = 1;
    updateSummaryCards();
    populateTransactionsTable();
    renderCharts();
});

// Date range functionality
document.getElementById('apply-date-range').addEventListener('click', applyDateFilter);
document.getElementById('reset-date-range').addEventListener('click', resetDateFilter);

// --- Upcoming Payments Editable Section ---

// Load/save from localStorage
const loadUpcomingPayments = () => {
    try {
        const data = localStorage.getItem('financeUpcomingPayments');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};
const saveUpcomingPayments = () => {
    localStorage.setItem('financeUpcomingPayments', JSON.stringify(upcomingPayments));
};

// Sample structure: { id, name, description, amount, date }
let upcomingPayments = loadUpcomingPayments();

function renderUpcomingPayments() {
    const list = document.getElementById('upcoming-payments-list');
    list.innerHTML = '';
    if (upcomingPayments.length === 0) {
        list.innerHTML = '<p class="text-gray-400 text-sm">No upcoming payments.</p>';
        return;
    }
    upcomingPayments.forEach(payment => {
        const div = document.createElement('div');
        div.className = "flex items-center justify-between";
        div.innerHTML = `
            <div>
                <p class="font-medium text-gray-200">${payment.name}</p>
                <p class="text-xs text-gray-400">${payment.description || ''}</p>
            </div>
            <div class="text-right">
                <p class="font-medium ${payment.amount >= 0 ? 'text-green-400' : 'text-red-400'}">${payment.amount >= 0 ? '+' : ''}${formatCurrency(payment.amount)}</p>
                <p class="text-xs text-gray-400">${payment.date}</p>
                <button class="edit-upcoming-btn text-blue-400 text-xs mr-2" data-id="${payment.id}">Edit</button>
                <button class="delete-upcoming-btn text-red-400 text-xs" data-id="${payment.id}">Delete</button>
            </div>
        `;
        list.appendChild(div);
    });

    // Edit
    document.querySelectorAll('.edit-upcoming-btn').forEach(btn => {
        btn.onclick = () => {
            const id = btn.getAttribute('data-id');
            const payment = upcomingPayments.find(p => p.id == id);
            if (!payment) return;
            const name = prompt('Name:', payment.name);
            if (name === null) return;
            const description = prompt('Description:', payment.description);
            if (description === null) return;
            const amount = parseFloat(prompt('Amount:', payment.amount));
            if (isNaN(amount)) return alert('Invalid amount');
            const date = prompt('Date (e.g. Aug 27):', payment.date);
            if (!date) return;
            payment.name = name;
            payment.description = description;
            payment.amount = amount;
            payment.date = date;
            saveUpcomingPayments();
            renderUpcomingPayments();
        };
    });

    // Delete
    document.querySelectorAll('.delete-upcoming-btn').forEach(btn => {
        btn.onclick = () => {
            const id = btn.getAttribute('data-id');
            if (confirm('Delete this payment?')) {
                upcomingPayments = upcomingPayments.filter(p => p.id != id);
                saveUpcomingPayments();
                renderUpcomingPayments();
            }
        };
    });
}

document.getElementById('add-upcoming-payment-btn').onclick = () => {
    const name = prompt('Payment name:');
    if (!name) return;
    const description = prompt('Description:');
    const amount = parseFloat(prompt('Amount:'));
    if (isNaN(amount) || amount <= 0) return alert('Please enter a valid amount.');
    const date = prompt('Date (e.g. Aug 27):');
    if (!date) return;

    const newPayment = {
        id: Date.now().toString(),
        name,
        description,
        amount,
        date
    };

    upcomingPayments.push(newPayment);
    saveUpcomingPayments();
    renderUpcomingPayments();
    showToast('Upcoming payment added!');
};

// Initial render on page load
window.onload = () => {
    // Set default date values
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    document.getElementById('start-date').valueAsDate = firstDay;
    document.getElementById('end-date').valueAsDate = lastDay;
    
    // Set current month display
    document.getElementById('current-month-display').textContent = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    // Add dedicated elements for progress text if not present
    if (!document.getElementById('budget-spent-text')) {
        const monthlyBudgetCard = document.querySelector('.card:nth-child(4)');
        if (monthlyBudgetCard) {
            const p = document.createElement('p');
            p.id = 'budget-spent-text';
            p.className = 'text-xs text-gray-400 mt-1';
            monthlyBudgetCard.appendChild(p);
        }
    }
    if (!document.getElementById('savings-progress-text')) {
        const savingsGoalCard = document.querySelector('.card:nth-child(5)');
        if (savingsGoalCard) {
            const p = document.createElement('p');
            p.id = 'savings-progress-text';
            p.className = 'text-xs text-gray-400 mt-1';
            savingsGoalCard.appendChild(p);
        }
    }

    // Initialize data displays
    updateSummaryCards();
    populateTransactionsTable();
    renderCharts();
    
    // Display an initial insight
    document.getElementById('refresh-insights-btn').click();
    
    // Populate category select
    const categorySelect = document.getElementById('transactionCategory');
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // Add sample transactions if none exist
    if (transactionsData.length === 0) {
        // No default transactions will be added
        saveTransactionsToLocalStorage();
        updateSummaryCards();
        populateTransactionsTable();
        renderCharts();
    }

    // Render upcoming payments
    renderUpcomingPayments();
};