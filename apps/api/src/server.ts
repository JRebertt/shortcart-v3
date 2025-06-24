import { env } from "@shortcart-v3/env"
import { app } from "./http/routes/app"

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log('Http server runnig 🚀')
})

