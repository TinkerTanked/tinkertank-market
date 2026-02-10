'use client'

import { MapPinIcon, ClockIcon, CalendarIcon, UserIcon, InformationCircleIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { StudentInfo } from './IgniteStudentStep'

export type IgniteProgramType = 'in-school' | 'drop-off' | 'school-pickup'

export interface IgniteSession {
  id: string
  name: string
  programType: IgniteProgramType
  location: string
  address?: string
  weekDays: number[]
  startTime: string
  endTime: string
  pricePerWeek: number
}

interface IgniteConfirmStepProps {
  session: IgniteSession
  studentInfo: StudentInfo
  onSubscribe: () => void
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const PROGRAM_BADGES: Record<IgniteProgramType, { bg: string; text: string; label: string }> = {
  'in-school': {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'In-School Program'
  },
  'drop-off': {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'Drop-Off Program'
  },
  'school-pickup': {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    label: 'School Pickup Program'
  }
}

function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'pm' : 'am'
  const hours12 = hours % 12 || 12
  return `${hours12}:${minutes.toString().padStart(2, '0')}${period}`
}

function formatWeekDays(weekDays: number[]): string {
  if (weekDays.length === 5 && weekDays.every((d, i) => d === i + 1)) {
    return 'Monday to Friday'
  }
  return weekDays.map(d => DAYS[d - 1]).join(', ')
}

export default function IgniteConfirmStep({ session, studentInfo, onSubscribe }: IgniteConfirmStepProps) {
  const badge = PROGRAM_BADGES[session.programType]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Your Subscription</h3>
        <p className="text-gray-600">Check the details before adding to cart</p>
      </div>

      <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text} mb-2`}>
              {badge.label}
            </span>
            <h4 className="text-xl font-bold text-gray-900">{session.name}</h4>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">${session.pricePerWeek}</div>
            <div className="text-sm text-gray-600">per week</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-4 h-4 text-primary-600 flex-shrink-0" />
            <span className="text-gray-700">{session.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-4 h-4 text-primary-600 flex-shrink-0" />
            <span className="text-gray-700">{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-primary-600 flex-shrink-0" />
            <span className="text-gray-700">{formatWeekDays(session.weekDays)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <UserIcon className="w-4 h-4 text-primary-600 flex-shrink-0" />
            <span className="text-gray-700">{studentInfo.firstName} {studentInfo.lastName}</span>
          </div>
        </div>

        {session.address && (
          <div className="mt-3 pt-3 border-t border-primary-100">
            <p className="text-sm text-gray-600">{session.address}</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-lg p-4 flex items-start space-x-3">
        <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-900 font-medium">Weekly Subscription</p>
          <p className="text-sm text-blue-800 mt-1">
            This is a weekly subscription. You will be charged ${session.pricePerWeek} each week. 
            You can cancel anytime from your account.
          </p>
        </div>
      </div>

      <button
        onClick={onSubscribe}
        className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        <ShoppingCartIcon className="w-5 h-5" />
        Add to Cart - ${session.pricePerWeek}/week
      </button>

      <p className="text-xs text-center text-gray-500">
        By adding to cart, you agree to our terms of service and cancellation policy
      </p>
    </div>
  )
}
