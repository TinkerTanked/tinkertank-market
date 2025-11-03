import { z } from 'zod'
import { differenceInYears, parse, isValid } from 'date-fns'

// Student interface
export interface Student {
  id?: string
  name: string
  birthdate: Date
  allergies: string[]
  age?: number
}

// Zod validation schema for student
export const StudentSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  birthdate: z.coerce
    .date()
    .refine(date => differenceInYears(new Date(), date) >= 2, 'Student must be at least 2 years old')
    .refine(date => differenceInYears(new Date(), date) <= 18, 'Student must be under 18 years old'),
  allergies: z.array(z.string().trim()).default([]),
})

// Student form schema for UI forms
export const StudentFormSchema = z.object({
  name: StudentSchema.shape.name,
  birthdate: z
    .string()
    .refine(date => {
      const parsed = parse(date, 'yyyy-MM-dd', new Date())
      return isValid(parsed)
    }, 'Invalid date format')
    .transform(date => parse(date, 'yyyy-MM-dd', new Date())),
  allergies: z
    .string()
    .transform(str =>
      str
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    )
    .default([]),
})

export type StudentInput = z.infer<typeof StudentSchema>
export type StudentFormInput = z.infer<typeof StudentFormSchema>

// Utility functions
export const calculateAge = (birthdate: Date): number => {
  return differenceInYears(new Date(), birthdate)
}

export const isStudentValid = (student: unknown): student is Student => {
  return StudentSchema.safeParse(student).success
}

export const formatBirthdateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0]
}
