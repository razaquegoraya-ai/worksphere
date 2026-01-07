module.exports = {
  datasource: {
    provider: 'postgresql',
    url: { fromEnvVar: 'DATABASE_URL' },
  },
}
