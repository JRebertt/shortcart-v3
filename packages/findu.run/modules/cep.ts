import { z } from 'zod'
import { http } from '../http'

const cepInputSchema = z.string().regex(/^\d{8}$/, 'CEP inválido')
const cepSchema = z.object({
  cep: z.string(),
  logradouro: z.string(),
  bairro: z.string(),
  localidade: z.string(),
  uf: z.string(),
})

export type CepResponse = z.infer<typeof cepSchema>

export async function cep(input: string): Promise<CepResponse> {
  const cep = input.replace(/\D/g, '')
  cepInputSchema.parse(cep)

  const res = await http.get(`/cep/${cep}`)
  const json = await res.body.json()
  return cepSchema.parse(json)
}
