var cardTemplate = Handlebars.compile(`
    <div class="statement-card">
        <p class="monthly-balance">{{balance}}</p>
        <p class="month-year">{{monthYear}}</p>
        <p class="monthly-debit">{{debit}}</p>
        <p class="monthly-credit">{{credit}}</p>
    </div>
`);

const baseUrl = 'https://jsonmock.hackerrank.com/api/transactions'

async function fetchTransactions(userId){
    let transactionsArray = [];
    const firstTransactionsPageResponse = await fetch(baseUrl + '?userId=' + userId);
    const firstTransactionsPage = await firstTransactionsPageResponse.json();

    transactionsArray.push(...firstTransactionsPage.data);

    const { total_pages } = firstTransactionsPage;

    for (let page = 2; page <= total_pages; page++) {
        const transactionsPage = await fetchTransactionsPage(userId, page)
        transactionsArray.push(...transactionsPage);
    }

    return transactionsArray;
}

async function fetchTransactionsPage(userId, page){
    const transactionsPageResponse = await fetch(baseUrl + '?userId=' + userId + '&page=' + page);
    const transactionsPage = await transactionsPageResponse.json();

    return transactionsPage.data;
}


function getMonthYear(transaction){
    const date = new Date(transaction.timestamp)
    let month = date.getMonth() + 1;
    const year = date.getFullYear();

    if(month < 10) month = '0' + month;

    return month + '-' + year;
}

function getMonthlyStatements(transactions){
    let monthlyStatements = {}
    transactions.forEach(transaction => {
        console.log('Transaction amount', transaction.amount, accounting.unformat(transaction.amount))
        const monthYear = getMonthYear(transaction);
        if(!monthlyStatements[monthYear]) monthlyStatements[monthYear] = {debit: 0.0, credit: 0.0};

        if(transaction.txnType == 'debit') monthlyStatements[monthYear].debit += accounting.unformat(transaction.amount);
        if(transaction.txnType == 'credit') monthlyStatements[monthYear].credit += accounting.unformat(transaction.amount);
    });

    return monthlyStatements
}

function getTotalBalance(monthlyStatements){
    let totalBalance = 0.0
    for(let monthYear in monthlyStatements){
        totalBalance += monthlyStatements[monthYear].credit - monthlyStatements[monthYear].debit;
    }

    return totalBalance
}


$('#loader-view').hide();
$('#submit-btn').on('click', event => {
    const userId = $('#user-select option:selected').val();
    if(userId > 0){
        $('#loader-view').show();
        $('#monthly-statements').empty();
        $('#user-name').text('');
        $('#user-balance').text('');
        fetchTransactions(userId)
            .then(transactions =>{
                $('#loader-view').hide();
                const monthlyStatements = getMonthlyStatements(transactions);
                const totalBalance = getTotalBalance(monthlyStatements);

                $('#user-name').text(transactions[0].userName);
                $('#user-balance').text(accounting.formatMoney(totalBalance));

                for(let monthYear in monthlyStatements){
                    $('#monthly-statements').append(cardTemplate({
                        monthYear,
                        credit: accounting.formatMoney(monthlyStatements[monthYear].credit),
                        debit: accounting.formatMoney(monthlyStatements[monthYear].debit),
                        balance: accounting.formatMoney(monthlyStatements[monthYear].credit - monthlyStatements[monthYear].debit)
                    }))
                }
            })
    }
});