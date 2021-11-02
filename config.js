module.exports = {
    // Host
    BASE_URL: process.env.BASE_URL || "https://app.realfoodtw.com",

    // SQL
    DB_URL: process.env.DB_URL || '35.201.146.41',
    DB_USERNAME: process.env.DB_USERNAME || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || 'hsnl33564',

    // Vendor
    

    // PubSub
    
    // Cloud service account
    GCP_PROJECT_ID: "",
    FIREBASE_ADMIN_CREDENTIALS: process.env.FIREBASE_ADMIN_CREDENTIALS || "",

    // SMTP
    EMAIL_USERNAME: process.env.EMAIL_USERNAME || 'ktgintkd@gmail.com',
    API_KEY: process.env.API_EKY || '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',

    // Ethereum 
    ETHEREUM_URL: process.env.ETHEREUM_URL || 'https://goerli.infura.io/v3/835e763893664a92bd8b9ca1ae8ea6ba'
}