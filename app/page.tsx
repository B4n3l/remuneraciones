"use client";

import Link from "next/link";
import {
  ChartBarIcon,
  DocumentTextIcon,
  CalculatorIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: ChartBarIcon,
      title: "Liquidaciones de Sueldo",
      description: "Genera liquidaciones automáticas con cálculo de AFP, salud, impuestos y bonos. Descarga PDFs profesionales.",
      color: "blue"
    },
    {
      icon: DocumentTextIcon,
      title: "Generación de Contratos",
      description: "Crea contratos de trabajo personalizados: indefinidos, plazo fijo u obra. Cumple con la legislación chilena.",
      color: "green"
    },
    {
      icon: CalculatorIcon,
      title: "Calculadora de Honorarios",
      description: "Calcula boletas de honorarios con retención automática del 12.25%. Obtén el líquido a recibir al instante.",
      color: "purple"
    },
    {
      icon: ClipboardDocumentCheckIcon,
      title: "Calculadora de Finiquitos",
      description: "Determina el monto exacto a pagar por años de servicio, vacaciones proporcionales e indemnizaciones.",
      color: "orange"
    },
    {
      icon: ClockIcon,
      title: "Control de Asistencia",
      description: "Registra entrada y salida de trabajadores. Genera reportes de asistencia mensual automáticamente.",
      color: "indigo"
    },
    {
      icon: CalendarIcon,
      title: "Gestión de Vacaciones",
      description: "Administra solicitudes, saldos y períodos de vacaciones. Mantén el control total del año laboral.",
      color: "teal"
    }
  ];

  const audiences = [
    {
      emoji: "📊",
      title: "Contadores",
      benefits: [
        "Automatiza procesos repetitivos",
        "Reduce errores de cálculo",
        "Genera documentación legal",
        "Ahorra horas de trabajo mensual"
      ]
    },
    {
      emoji: "🏢",
      title: "Pymes",
      benefits: [
        "Administra nóminas sin contador",
        "Cumple con obligaciones legales",
        "Controla costos laborales",
        "Gestiona múltiples trabajadores"
      ]
    },
    {
      emoji: "💼",
      title: "Emprendedores",
      benefits: [
        "Herramientas profesionales accesibles",
        "Sin conocimientos contables previos",
        "Calculadoras gratuitas",
        "Escala cuando crezcas"
      ]
    }
  ];

  const pricing = [
    {
      name: "Gratis",
      price: "$0",
      period: "siempre",
      features: [
        "Calculadora de honorarios",
        "Calculadora de finiquitos",
        "Hasta 5 liquidaciones/mes",
        "Soporte por email"
      ],
      cta: "Comenzar Gratis",
      highlighted: false
    },
    {
      name: "Profesional",
      price: "$19.990",
      period: "mensual",
      features: [
        "Liquidaciones ilimitadas",
        "Generación de contratos",
        "Control de asistencia",
        "Gestión de vacaciones",
        "Descarga de PDFs",
        "Soporte prioritario"
      ],
      cta: "Probar 14 días gratis",
      highlighted: true
    },
    {
      name: "Empresa",
      price: "$49.990",
      period: "mensual",
      features: [
        "Todo de Profesional",
        "Multi-empresa",
        "Usuarios ilimitados",
        "API de integración",
        "Capacitación personalizada",
        "Soporte 24/7"
      ],
      cta: "Contactar Ventas",
      highlighted: false
    }
  ];

  const faqs = [
    {
      q: "¿Cómo funciona la prueba gratuita?",
      a: "La prueba de 14 días te da acceso completo al plan Profesional sin necesidad de tarjeta de crédito. Puedes cancelar en cualquier momento."
    },
    {
      q: "¿Los cálculos cumplen con la legislación chilena?",
      a: "Sí, todos nuestros cálculos están actualizados según el Código del Trabajo y la normativa vigente de la Dirección del Trabajo."
    },
    {
      q: "¿Puedo importar mis trabajadores actuales?",
      a: "Por supuesto. Puedes agregar trabajadores manualmente o contactarnos para importación masiva desde Excel."
    },
    {
      q: "¿Qué pasa si cambio de plan?",
      a: "Puedes cambiar entre planes en cualquier momento. Los cambios se aplican de inmediato y ajustamos el cobro proporcionalmente."
    },
    {
      q: "¿Ofrecen capacitación?",
      a: "El plan Empresa incluye capacitación personalizada. También ofrecemos webinars gratuitos mensuales para todos los usuarios."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Centro Contable</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                Comenzar Gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
              Centro Contable
            </h1>
            <p className="text-2xl md:text-3xl text-gray-600 mb-4">
              Tu Aliado en Gestión Laboral y Contable
            </p>
            <p className="text-xl text-gray-500 mb-12 max-w-3xl mx-auto">
              Simplifica nóminas, contratos y cálculos tributarios.
              Todo en una plataforma profesional diseñada para Chile.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition-colors shadow-lg"
              >
                Comenzar Gratis
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 text-lg font-semibold rounded-lg border-2 border-gray-200 transition-colors"
              >
                Ver Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Módulos y Herramientas
            </h2>
            <p className="text-xl text-gray-600">
              Todo lo que necesitas para gestionar tu área laboral y contable
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all"
              >
                <feature.icon className={`h-12 w-12 text-${feature.color}-600 mb-4`} />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Para quién es Centro Contable?
            </h2>
            <p className="text-xl text-gray-600">
              Diseñado para profesionales y empresas de todos los tamaños
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {audiences.map((audience, idx) => (
              <div key={idx} className="bg-white p-8 rounded-xl shadow-md">
                <div className="text-5xl mb-4 text-center">{audience.emoji}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  {audience.title}
                </h3>
                <ul className="space-y-3">
                  {audience.benefits.map((benefit, bidx) => (
                    <li key={bidx} className="flex items-start gap-3">
                      <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Planes y Precios
            </h2>
            <p className="text-xl text-gray-600">
              Comienza gratis, escala cuando lo necesites
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-8 ${plan.highlighted ? 'bg-blue-600 text-white shadow-2xl scale-105' : 'bg-white border-2 border-gray-200'}`}
              >
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-lg ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>
                    /{plan.period}
                  </span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-3">
                      <CheckCircleIcon className={`h-6 w-6 flex-shrink-0 ${plan.highlighted ? 'text-white' : 'text-green-600'}`} />
                      <span className={plan.highlighted ? 'text-blue-50' : 'text-gray-700'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-colors ${plan.highlighted
                    ? 'bg-white text-blue-600 hover:bg-gray-100'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-xl text-gray-600">
              Todo lo que necesitas saber
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                  <span className="text-2xl text-gray-400">{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ChartBarIcon className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">Centro Contable</span>
              </div>
              <p className="text-gray-400">
                Simplificando la gestión laboral y contable para Chile.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Características</Link></li>
                <li><Link href="#" className="hover:text-white">Precios</Link></li>
                <li><Link href="#" className="hover:text-white">Recursos</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Sobre Nosotros</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
                <li><Link href="#" className="hover:text-white">Contacto</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Términos de Uso</Link></li>
                <li><Link href="#" className="hover:text-white">Privacidad</Link></li>
                <li><Link href="#" className="hover:text-white">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Centro Contable. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
