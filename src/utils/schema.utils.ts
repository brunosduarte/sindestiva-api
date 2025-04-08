import { z } from 'zod';

/**
 * Converte um schema Zod para um schema compatível com Fastify
 * 
 * @param schema Schema Zod
 * @returns Objeto de schema compatível com Fastify
 */
export function zodToJsonSchema(schema: z.ZodObject<any>) {
  const jsonSchema = {
    type: 'object',
    required: [] as string[],
    properties: {} as Record<string, any>
  };

  // Obter todas as propriedades do schema
  const shape = schema._def.shape();
  
  // Para cada propriedade no schema
  for (const [key, value] of Object.entries(shape)) {
    // Verificar se é um campo obrigatório
    if (!value.isOptional()) {
      jsonSchema.required.push(key);
    }

    // Definir o tipo de acordo com o tipo Zod
    let property: any = { type: 'string' };

    // String com validação
    if (value instanceof z.ZodString) {
      property = { type: 'string' };
      
      // Verificar se tem validação de email
      const checks = value._def.checks;
      if (checks && checks.some((check: any) => check.kind === 'email')) {
        property.format = 'email';
      }

      // Verificar validação de tamanho mínimo
      if (checks && checks.some((check: any) => check.kind === 'min')) {
        const minCheck = checks.find((check: any) => check.kind === 'min');
        property.minLength = minCheck.value;
      }
    }
    // Número
    else if (value instanceof z.ZodNumber) {
      property = { type: 'number' };
    }
    // Boolean
    else if (value instanceof z.ZodBoolean) {
      property = { type: 'boolean' };
    }
    // Array
    else if (value instanceof z.ZodArray) {
      property = { 
        type: 'array',
        items: { type: 'string' } // Simplificado para strings
      };
    }
    // Data
    else if (value instanceof z.ZodDate) {
      property = { 
        type: 'string',
        format: 'date-time'
      };
    }
    // Enum
    else if (value instanceof z.ZodEnum) {
      property = { 
        type: 'string',
        enum: value._def.values
      };
    }
    
    // Adicionar propriedade ao schema
    jsonSchema.properties[key] = property;
  }

  return jsonSchema;
}