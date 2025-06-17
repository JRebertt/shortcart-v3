# Guia de Desenvolvimento

## 🏗️ Arquitetura do Monorepo

### **Estrutura de Packages**

O monorepo está organizado em camadas bem definidas:

#### **Apps (Aplicações)**
- `apps/api/` - API principal com Fastify
- `apps/admin-dashboard/` - Dashboard administrativo (futuro)

#### **Packages Compartilhados**
- `packages/shared/` - Tipos, enums e utilitários
- `packages/database/` - Schema Drizzle + conexão PostgreSQL
- `packages/validation/` - Schemas Zod para validação
- `packages/auth/` - BetterAuth + CASL para autorização
- `packages/payment-gateways/` - Gateways modulares
- `packages/notifications/` - Sistema de notificações
- `packages/analytics/` - UTMify + analytics

### **Fluxo de Dados**

```
Cliente → API → Validation → Auth → Business Logic → Database
                    ↓
              Payment Gateway → Webhook → Notifications
                    ↓
                Analytics → UTMify
```

## 🔧 Desenvolvimento

### **Comandos Principais**

```bash
# Instalar dependências
pnpm install

# Desenvolvimento (todos os packages)
pnpm dev

# Desenvolvimento (apenas API)
pnpm --filter @shortcart-v3/api dev

# Build (todos os packages)
pnpm build

# Build (package específico)
pnpm --filter @shortcart-v3/database build

# Testes
pnpm test

# Linting
pnpm lint

# Type checking
pnpm type-check
```

### **Adicionando Novos Packages**

1. **Criar estrutura do package:**
```bash
mkdir packages/novo-package
cd packages/novo-package
```

2. **Criar package.json:**
```json
{
  "name": "@shortcart-v3/novo-package",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@shortcart-v3/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.2"
  }
}
```

3. **Configurar TypeScript:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

4. **Atualizar turbo.json:**
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

### **Adicionando Novos Gateways**

1. **Criar provider:**
```typescript
// packages/payment-gateways/src/providers/novo-gateway.ts
export class NovoGateway implements PaymentGateway {
  public readonly provider = GatewayProvider.NOVO;
  public readonly name = 'Novo Gateway';
  
  // Implementar interface PaymentGateway
}
```

2. **Registrar no factory:**
```typescript
// packages/payment-gateways/src/factory/gateway-factory.ts
case GatewayProvider.NOVO:
  gateway = new NovoGateway();
  break;
```

3. **Adicionar ao enum:**
```typescript
// packages/shared/src/types.ts
export enum GatewayProvider {
  NOVO = 'novo',
  // ...
}
```

### **Sistema de Migrations**

```bash
# Gerar migration
cd packages/database
pnpm run db:generate

# Aplicar migrations
pnpm run db:migrate

# Reset do banco (desenvolvimento)
pnpm run db:reset
```

### **Debugging**

#### **API**
```bash
# Debug mode
NODE_ENV=development DEBUG=* pnpm --filter @shortcart-v3/api dev

# Logs específicos
DEBUG=fastify:* pnpm --filter @shortcart-v3/api dev
```

#### **Database**
```bash
# Logs do Drizzle
DATABASE_LOG=true pnpm --filter @shortcart-v3/api dev
```

## 🧪 Testes

### **Estrutura de Testes**

```
packages/payment-gateways/
├── src/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
└── jest.config.js
```

### **Configuração Jest**

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
};
```

### **Exemplo de Teste**

```typescript
// tests/unit/mangofy-gateway.test.ts
import { MangofyGateway } from '../../src/providers/mangofy-gateway';

describe('MangofyGateway', () => {
  let gateway: MangofyGateway;

  beforeEach(() => {
    gateway = new MangofyGateway();
  });

  it('should configure correctly', () => {
    gateway.configure({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      environment: 'sandbox',
    });

    expect(gateway.isConfigured()).toBe(true);
  });
});
```

## 🚀 Deploy

### **Preparação para Produção**

1. **Build otimizado:**
```bash
NODE_ENV=production pnpm build
```

2. **Variáveis de ambiente:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
AUTH_SECRET=production-secret
# ... outras variáveis
```

3. **Migrations:**
```bash
pnpm --filter @shortcart-v3/database run db:migrate
```

### **Docker**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar package files
COPY package.json pnpm-lock.yaml ./
COPY packages/*/package.json ./packages/*/
COPY apps/*/package.json ./apps/*/

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código
COPY . .

# Build
RUN pnpm build

# Expor porta
EXPOSE 3000

# Comando de start
CMD ["pnpm", "--filter", "@shortcart-v3/api", "start"]
```

### **Docker Compose**

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/checkout_saas
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=checkout_saas
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔒 Segurança

### **Autenticação**

- JWT tokens com expiração
- Refresh tokens seguros
- Rate limiting por IP
- CORS configurado

### **Autorização**

- CASL para controle granular
- Scopes em API Keys
- Isolamento por organização
- Validação de permissões

### **Dados Sensíveis**

- Criptografia de chaves de gateway
- Hash de senhas com bcrypt
- Logs sem dados sensíveis
- Validação de entrada rigorosa

### **Webhooks**

- Assinatura HMAC
- Validação de timestamp
- Rate limiting
- Retry com backoff

## 📊 Monitoramento

### **Logs**

```typescript
// Estrutura de logs
{
  level: 'info',
  timestamp: '2024-01-01T00:00:00Z',
  service: 'api',
  traceId: 'uuid',
  userId: 'user-id',
  organizationId: 'org-id',
  message: 'Payment processed',
  metadata: {
    paymentId: 'payment-id',
    gateway: 'mangofy',
    amount: 1000
  }
}
```

### **Métricas**

- Latência de pagamentos
- Taxa de sucesso por gateway
- Volume de transações
- Erros por endpoint
- Health checks

### **Alertas**

- Gateway indisponível
- Taxa de erro alta
- Latência elevada
- Falhas de webhook
- Limites de rate limit

## 🔧 Troubleshooting

### **Problemas Comuns**

#### **Gateway não responde**
```bash
# Verificar health check
curl http://localhost:3000/api/health

# Logs do gateway
DEBUG=gateway:* pnpm dev
```

#### **Erro de conexão com banco**
```bash
# Verificar conexão
psql $DATABASE_URL -c "SELECT 1"

# Verificar migrations
pnpm --filter @shortcart-v3/database run db:status
```

#### **Webhook não recebido**
```bash
# Verificar logs de webhook
DEBUG=webhook:* pnpm dev

# Testar endpoint
curl -X POST http://localhost:3000/checkout/webhook/mangofy \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### **Performance**

#### **Otimização de Queries**
```typescript
// Usar select específico
const users = await db.select({
  id: schema.users.id,
  email: schema.users.email,
}).from(schema.users);

// Usar índices
// CREATE INDEX idx_payments_organization_id ON payments(organization_id);
```

#### **Cache**
```typescript
// Redis para cache de sessões
const session = await redis.get(`session:${sessionId}`);
if (!session) {
  // Buscar no banco e cachear
}
```

## 📚 Recursos Adicionais

### **Documentação**
- [Fastify](https://www.fastify.io/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [BetterAuth](https://www.better-auth.com/)
- [Turborepo](https://turbo.build/)

### **Ferramentas**
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)
- [Postman Collection](./docs/postman-collection.json)
- [VS Code Extensions](./docs/vscode-extensions.md)

### **Exemplos**
- [Integração Frontend](./examples/frontend-integration/)
- [Webhook Handlers](./examples/webhook-handlers/)
- [Custom Gateway](./examples/custom-gateway/)

