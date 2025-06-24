import { z } from 'zod'
import { http } from '../http'

const cpfInputSchema = z.object({
  cpf: z.string().regex(/^\d{11}$/, 'CPF inválido'),
  full: z.boolean().optional().default(false),
})

export const cpfSchema = z.object({
  cpf: z.string(),
  formattedCpf: z.string(),
  name: z.string(),
  firstName: z.string(),
  birthDate: z.string(),
  motherName: z.string(),
  gender: z.string(),
})

export const cpfFullSchema = z.object({
  DADOS: z.array(
    z.object({
      CPF: z.string(),
      NOME: z.string(),
      SEXO: z.string(),
      NASC: z.string(),
      NOME_MAE: z.string(),
      NOME_PAI: z.string().optional(),
      ESTCIV: z.string().optional(),
      NACIONALID: z.string().optional(),
      RG: z.string().optional(),
      ORGAO_EMISSOR: z.string().optional(),
      UF_EMISSAO: z.string().optional(),
      DT_OB: z.string().optional(),
      RENDA: z.string().optional(),
      DT_INFORMACAO: z.string().optional(),
      TITULO_ELEITOR: z.string().optional(),
    })
  ),
  EMAIL: z.array(z.object({ EMAIL: z.string().email().optional() })),
  HISTORICO_TELEFONES: z.array(
    z.object({
      DDD: z.string(),
      TELEFONE: z.string(),
      TIPO_TELEFONE: z.string(),
      DT_INCLUSAO: z.string().optional(),
      DT_INFORMACAO: z.string().nullable().optional(),
      SIGILO: z.string().optional(),
      NSU: z.string().optional(),
      CLASSIFICACAO: z.string(),
    })
  ),
  PARENTES: z.array(
    z.object({
      VINCULO: z.string(),
      CPF_VINCULO: z.number(),
      NOME_VINCULO: z.string(),
    })
  ),
  PODER_AQUISITIVO: z.array(
    z.object({
      COD_PODER_AQUISITIVO: z.number(),
      PODER_AQUISITIVO: z.string(),
      RENDA_PODER_AQUISITIVO: z.string(),
      FX_PODER_AQUISITIVO: z.string(),
    })
  ),
  ENDERECOS: z.array(
    z.object({
      LOGR_TIPO: z.string(),
      LOGR_NOME: z.string(),
      LOGR_NUMERO: z.string(),
      LOGR_COMPLEMENTO: z.string().nullable().optional(),
      BAIRRO: z.string(),
      CIDADE: z.string(),
      UF: z.string(),
      CEP: z.string(),
      DT_ATUALIZACAO: z.string().nullable().optional(),
    })
  ),
  PIS: z.array(z.object({ PIS: z.number() })),
  UNIVERSITARIO: z.array(z.unknown()).optional(),
  SCORE: z.array(
    z.object({
      CSB8: z.any().nullable(),
      CSB8_FAIXA: z.any().nullable(),
      CSBA: z.number().nullable(),
      CSBA_FAIXA: z.string().nullable(),
    })
  ),
  IRPF: z.array(
    z.object({
      DocNumber: z.number(),
      Instituicao_Bancaria: z.string(),
      Cod_Agencia: z.string(),
      Lote: z.string(),
      Sit_Receita_Federal: z.string(),
      CADASTRO_ID: z.number(),
      CPF: z.number(),
      CONTATOS_ID: z.number(),
    })
  ),
  TSE: z.array(z.unknown()).optional(),
  INTERESSES: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))),
})

export type CpfInput = z.infer<typeof cpfInputSchema>
export type CpfBasicResponse = z.infer<typeof cpfSchema>
export type CpfFullResponse = z.infer<typeof cpfFullSchema>

export async function cpf(input: CpfInput): Promise<CpfBasicResponse | CpfFullResponse> {
  const { cpf, full } = cpfInputSchema.parse(input)
  const clean = cpf.replace(/\D/g, '')

  const endpoint = full ? '/cpf-full' : '/cpf'
  const query = new URLSearchParams({
    cpf: clean,
    source: 'findu',
  }).toString()

  const res = await http.get(`${endpoint}?${query}`)
  const json = await res.body.json()

  return full ? cpfFullSchema.parse(json) : cpfSchema.parse(json)
}
