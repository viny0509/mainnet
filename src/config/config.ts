import Joi from 'joi'
import 'dotenv/config'

const envVarsSchema = Joi.object()
  .keys({
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    API_URL: Joi.string().required().description('API URL'),
  })
  .unknown()

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env)

if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

export const config = {
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL,
  },
  apiUrl: envVars.API_URL,
}
