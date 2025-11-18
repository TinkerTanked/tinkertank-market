'use client'

import { useState } from 'react'
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  ClockIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    message: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement form submission
    setIsSubmitted(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div>
      {/* Hero Section */}
      <section className='py-16 bg-gradient-to-br from-primary-50 to-accent-50'>
        <div className='container-custom text-center'>
          <h1 className='text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4'>
            Get in Touch
          </h1>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            Have questions about our programs? We'd love to hear from you and help find the perfect STEM experience for your child.
          </p>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className='py-20'>
        <div className='container-custom'>
          <div className='grid lg:grid-cols-2 gap-16'>
            {/* Contact Information */}
            <div className='space-y-8'>
              <div className='space-y-6'>
                <h2 className='text-3xl font-display font-bold text-gray-900'>
                  Let's Connect
                </h2>
                <p className='text-lg text-gray-600'>
                  Reach out to us through any of these channels. We typically respond within 24 hours.
                </p>
              </div>

              <div className='space-y-6'>
                <div className='flex items-start space-x-4'>
                  <div className='w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <PhoneIcon className='w-6 h-6 text-primary-600' />
                  </div>
                  <div>
                    <h3 className='font-display font-semibold text-lg text-gray-900'>Phone</h3>
                    <p className='text-gray-600'>Give us a call for immediate assistance</p>
                    <a 
                      href='tel:+61404123456' 
                      className='text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200'
                    >
                      0404 123 456
                    </a>
                  </div>
                </div>

                <div className='flex items-start space-x-4'>
                  <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <EnvelopeIcon className='w-6 h-6 text-green-600' />
                  </div>
                  <div>
                    <h3 className='font-display font-semibold text-lg text-gray-900'>Email</h3>
                    <p className='text-gray-600'>Send us a message anytime</p>
                    <a 
                      href='mailto:hello@tinkertank.com.au' 
                      className='text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200'
                    >
                      hello@tinkertank.com.au
                    </a>
                  </div>
                </div>

                <div className='flex items-start space-x-4'>
                  <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <MapPinIcon className='w-6 h-6 text-blue-600' />
                  </div>
                  <div>
                    <h3 className='font-display font-semibold text-lg text-gray-900'>Location</h3>
                    <p className='text-gray-600'>Visit us in beautiful Neutral Bay</p>
                    <p className='text-gray-700'>
                      Neutral Bay<br />
                      Sydney, NSW 2089
                    </p>
                  </div>
                </div>

                <div className='flex items-start space-x-4'>
                  <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <ClockIcon className='w-6 h-6 text-purple-600' />
                  </div>
                  <div>
                    <h3 className='font-display font-semibold text-lg text-gray-900'>Office Hours</h3>
                    <p className='text-gray-600'>When we're here to help</p>
                    <div className='text-gray-700'>
                      <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                      <p>Saturday - Sunday: 9:00 AM - 5:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className='bg-white rounded-2xl shadow-lg p-8'>
              {isSubmitted ? (
                <div className='text-center space-y-6'>
                  <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
                    <CheckIcon className='w-8 h-8 text-green-600' />
                  </div>
                  <div className='space-y-2'>
                    <h3 className='text-2xl font-display font-bold text-gray-900'>Message Sent!</h3>
                    <p className='text-gray-600'>
                      Thanks for reaching out. We'll get back to you within 24 hours.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className='btn-outline'
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-6'>
                  <h2 className='text-2xl font-display font-bold text-gray-900'>
                    Send us a Message
                  </h2>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Your Name *
                      </label>
                      <input
                        type='text'
                        name='name'
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                        placeholder='Enter your name'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Email *
                      </label>
                      <input
                        type='email'
                        name='email'
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                        placeholder='Enter your email'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Phone (Optional)
                    </label>
                    <input
                      type='tel'
                      name='phone'
                      value={formData.phone}
                      onChange={handleChange}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                      placeholder='Enter your phone number'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Subject *
                    </label>
                    <select
                      name='subject'
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    >
                      <option value='general'>General Inquiry</option>
                      <option value='camps'>Camp Questions</option>
                      <option value='birthdays'>Birthday Party Inquiry</option>
                      <option value='ignite'>Ignite Program Questions</option>
                      <option value='pricing'>Pricing & Packages</option>
                      <option value='support'>Customer Support</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Message *
                    </label>
                    <textarea
                      name='message'
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                      placeholder='Tell us how we can help you...'
                    />
                  </div>

                  <button type='submit' className='btn-primary w-full text-lg py-4'>
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Contact Options */}
      <section className='py-20 bg-gray-50'>
        <div className='container-custom'>
          <div className='text-center space-y-4 mb-12'>
            <h2 className='text-3xl font-display font-bold text-gray-900'>
              Need Immediate Help?
            </h2>
            <p className='text-lg text-gray-600'>
              Choose the fastest way to get your questions answered
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='bg-white rounded-xl p-8 text-center shadow-lg'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <PhoneIcon className='w-8 h-8 text-green-600' />
              </div>
              <h3 className='font-display font-semibold text-xl text-gray-900 mb-2'>
                Call Us Now
              </h3>
              <p className='text-gray-600 mb-4'>
                Speak directly with our team for immediate assistance
              </p>
              <a href='tel:1300670104' className='btn-primary'>
                1300 670 104
              </a>
            </div>

            <div className='bg-white rounded-xl p-8 text-center shadow-lg'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <EnvelopeIcon className='w-8 h-8 text-blue-600' />
              </div>
              <h3 className='font-display font-semibold text-xl text-gray-900 mb-2'>
                Email Support
              </h3>
              <p className='text-gray-600 mb-4'>
                Send us a detailed message and we'll respond within 24 hours
              </p>
              <a href='mailto:hello@tinkertank.com.au' className='btn-outline'>
                Send Email
              </a>
            </div>

            <div className='bg-white rounded-xl p-8 text-center shadow-lg'>
              <div className='w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl'>💬</span>
              </div>
              <h3 className='font-display font-semibold text-xl text-gray-900 mb-2'>
                Live Chat
              </h3>
              <p className='text-gray-600 mb-4'>
                Chat with us during business hours for quick answers
              </p>
              <button className='btn-outline opacity-50 cursor-not-allowed'>
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
