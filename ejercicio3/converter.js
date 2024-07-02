class Currency {
    constructor(code, name) {
        this.code = code;
        this.name = name;
    }
}

class CurrencyConverter {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.currencies = [];
    }

    async getCurrencies() {
        try {
            const response = await fetch(`${this.apiUrl}/currencies`);
            const data = await response.json();
            this.currencies = Object.entries(data).map(
                ([code, name]) => new Currency(code, name)
            );
        } catch (error) {
            console.error("Error fetching currencies:", error);
        }
    }

    async convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency.code === toCurrency.code) {
            return parseFloat(amount);
        }

        try {
            const response = await fetch(
                `${this.apiUrl}/latest?amount=${amount}&from=${fromCurrency.code}&to=${toCurrency.code}`
            );
            const data = await response.json();
            return data.rates[toCurrency.code];
        } catch (error) {
            console.error("Error converting currency:", error);
            return null;
        }
    }

    async getExchangeRateDifference(fromCurrency, toCurrency) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            const todayResponse = await fetch(
                `${this.apiUrl}/${today}?from=${fromCurrency.code}&to=${toCurrency.code}`
            );
            const yesterdayResponse = await fetch(
                `${this.apiUrl}/${yesterday}?from=${fromCurrency.code}&to=${toCurrency.code}`
            );

            const todayData = await todayResponse.json();
            const yesterdayData = await yesterdayResponse.json();

            const todayRate = todayData.rates[toCurrency.code];
            const yesterdayRate = yesterdayData.rates[toCurrency.code];

            return todayRate - yesterdayRate;
        } catch (error) {
            console.error("Error fetching exchange rate difference:", error);
            return null;
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("conversion-form");
    const resultDiv = document.getElementById("result");
    const fromCurrencySelect = document.getElementById("from-currency");
    const toCurrencySelect = document.getElementById("to-currency");

    const converter = new CurrencyConverter("https://api.frankfurter.app");

    await converter.getCurrencies();
    populateCurrencies(fromCurrencySelect, converter.currencies);
    populateCurrencies(toCurrencySelect, converter.currencies);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const amount = document.getElementById("amount").value;
        const fromCurrency = converter.currencies.find(
            (currency) => currency.code === fromCurrencySelect.value
        );
        const toCurrency = converter.currencies.find(
            (currency) => currency.code === toCurrencySelect.value
        );

        const convertedAmount = await converter.convertCurrency(
            amount,
            fromCurrency,
            toCurrency
        );

        if (convertedAmount !== null && !isNaN(convertedAmount)) {
            resultDiv.textContent = `${amount} ${
                fromCurrency.code
            } son ${convertedAmount.toFixed(2)} ${toCurrency.code}`;
        } else {
            resultDiv.textContent = "Error al realizar la conversión.";
        }
    });

    function populateCurrencies(selectElement, currencies) {
        if (currencies) {
            currencies.forEach((currency) => {
                const option = document.createElement("option");
                option.value = currency.code;
                option.textContent = `${currency.code} - ${currency.name}`;
                selectElement.appendChild(option);
            });
        }
    }
});
