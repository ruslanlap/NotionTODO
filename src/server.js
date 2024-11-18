const corsOptions = {
  origin: ['https://doapp-ten.vercel.app/', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Notion-Version'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Додамо обробку OPTIONS запитів
app.options('*', cors(corsOptions));