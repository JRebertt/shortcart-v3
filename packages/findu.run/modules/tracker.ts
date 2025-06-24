import { z } from 'zod'
import { http } from '../http'

const trackerInputSchema = z.object({
  codigo: z.string().min(5),
  tipo: z.enum(['pacote', 'carta']).default('pacote'),
  formato: z.enum(['json', 'xml']).default('json'),
})

const trackerResponseSchema = z.object({
  status: z.string(),
  atualizadoEm: z.string(),
  eventos: z.array(
    z.object({
      descricao: z.string(),
      data: z.string(),
      local: z.string(),
    })
  ),
})

export type TrackerInput = z.infer<typeof trackerInputSchema>
export type TrackerResponse = z.infer<typeof trackerResponseSchema>

export async function tracker(params: TrackerInput): Promise<TrackerResponse> {
  const parsed = trackerInputSchema.parse(params)

  const res = await http.get(`/rastreio/${parsed.codigo}?tipo=${parsed.tipo}&formato=${parsed.formato}`)
  const json = await res.body.json()
  return trackerResponseSchema.parse(json)
}
