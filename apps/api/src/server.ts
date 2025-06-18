import fastify from 'fastify'
import fastifyRawBody from 'fastify-raw-body'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

import { env } from '@shortcart-v3/env'

import { errorHandler } from './middleware/error-handler'

import { authenticateWithPassword } from './http/routes/auth/authenticate-with-password'
import { createAccount } from './http/routes/auth/create-account'
import { getProfile } from './http/routes/auth/get-profile'
import { requestPasswordRecover } from './http/routes/auth/request-password-recover'
import { resetPassword } from './http/routes/auth/reset-password'

import { createOrganization } from './http/routes/organizations/create-organization'
import { getOrganizations } from './http/routes/organizations/get-organizations'

import { createProduct } from './http/routes/products/create-product'
import { getProducts } from './http/routes/products/get-products'

import { connectGateway } from './http/routes/gateways/connect-gateway'
import { getGateways } from './http/routes/gateways/get-gateways'

import { addPaymentMethod } from './http/routes/payment-methods/add-payment-method'
import { getPaymentMethods } from './http/routes/payment-methods/get-payment-methods'

import { processPayment } from './http/routes/payments/process-payment'

import { submitKycDocuments } from './http/routes/kyc/submit-documents'
import { getKycStatus } from './http/routes/kyc/get-status'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyRawBody, {
  field: 'rawBody',
  global: false,
  encoding: 'utf8',
  runFirst: true,
})

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.setErrorHandler(errorHandler)

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Next.js SaaS',
      description: 'Full-stack SaaS with multi-tenant & RBAC.',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
})

app.register(fastifySwaggerUI, {
  routePrefix: '/docs',
})

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

// Authenticate
app.register(authenticateWithPassword)
app.register(createAccount)
app.register(getProfile)
app.register(requestPasswordRecover)
app.register(resetPassword)

// Organizatons
app.register(createOrganization)
app.register(getOrganizations)

// Gateways
app.register(connectGateway)
app.register(getGateways)

// Payment methods
app.register(addPaymentMethod)
app.register(getPaymentMethods)

// Payments
app.register(processPayment)

// KYC
app.register(submitKycDocuments)
app.register(getKycStatus)

// Products
app.register(createProduct)
app.register(getProducts)

app.register(fastifyCors)

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log('Http server runnig 🚀')
})

