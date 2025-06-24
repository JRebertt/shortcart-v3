import fastify from 'fastify'
import fastifyRawBody from 'fastify-raw-body'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import fastifyJwt from '@fastify/jwt'
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

import { env } from '@shortcart-v3/env'

import { errorHandler } from '@/middleware/error-handler'

import { authenticateWithPassword } from '@/http/routes/auth/authenticate-with-password'
import { createAccount } from '@/http/routes/auth/create-account'
import { getProfile } from '@/http/routes/auth/get-profile'
import { requestPasswordRecover } from '@/http/routes/auth/request-password-recover'
import { resetPassword } from '@/http/routes/auth/reset-password'

export const app = fastify().withTypeProvider<ZodTypeProvider>()

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
// app.register(authenticateWithPassword)
app.register(createAccount)
// app.register(getProfile)
// app.register(requestPasswordRecover)
// app.register(resetPassword)

// // Organizatons
// app.register(createOrganization)
// app.register(getOrganizations)

// // Gateways
// app.register(connectGateway)
// app.register(getGateways)

// // Payment methods
// app.register(addPaymentMethod)
// app.register(getPaymentMethods)

// // Payments
// app.register(processPayment)

// // KYC
// app.register(submitKycDocuments)
// app.register(getKycStatus)

// // Products
// app.register(createProduct)
// app.register(getProducts)

// app.register(fastifyCors)