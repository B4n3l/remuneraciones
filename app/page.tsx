"use client";

import Link from "next/link";
import {
  CalculatorIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const services = [
    {
      icon: CurrencyDollarIcon,
      title: "Contabilidad General",
      description: "Llevamos tu contabilidad al día: libros contables, balances, estados de resultados y reportes financieros mensuales.",
      color: "blue"
    },
    {
      icon: DocumentTextIcon,
      title: "Remuneraciones",
      description: "Cálculo y pago de sueldos, liquidaciones, imposiciones, contratos de trabajo y finiquitos. Todo en regla con la legislación.",
      color: "green"
    },
    {
      icon: CalculatorIcon,
      title: "Declaraciones de Impuestos",
      description: "IVA mensual, renta anual, PPM, retenciones de honorarios. Cumplimos con todas tus obligaciones tributarias.",
      color: "purple"
    },
    {
      icon: BuildingOfficeIcon,
      title: "Constitución de Empresas",
      description: "Te ayudamos a crear tu empresa: EIRL, SpA, Ltda. Trámites en SII, inicio de actividades y patentes comerciales.",
      color: "orange"
    },
    {
      icon: ClipboardDocumentCheckIcon,
      title: "Asesoría Tributaria",
      description: "Optimiza tu carga tributaria legalmente. Te asesoramos en planificación fiscal y régimen de tributación.",
      color: "indigo"
    },
    {
      icon: UserGroupIcon,
      title: "Outsourcing Contable",
      description: "Externalizamos todo tu departamento contable. Nos integramos a tu equipo como si fuéramos parte de tu empresa.",
      color: "teal"
    }
  ];

  const benefits = [
    {
      emoji: "✅",
      title: "Experiencia",
      description: "Más de 15 años asesorando empresas de todos los tamaños en Chile."
    },
    {
      emoji: "📊",
      title: "Tecnología",
      description: "Utilizamos software de última generación para una gestión eficiente y precisa."
    },
    {
      emoji: "🤝",
      title: "Cercanía",
      description: "Atención personalizada. Un ejecutivo dedicado conoce tu negocio."
    },
    {
      emoji: "⚡",
      title: "Rapidez",
      description: "Respuestas en menos de 24 horas. Nunca te dejamos esperando."
    }
  ];

  const pricing = [
    {
      name: "Emprendedor",
      price: "$89.990",
      period: "mensual",
      description: "Ideal para negocios pequeños",
      features: [
        "Contabilidad simplificada",
        "Hasta 3 trabajadores",
        "Declaración IVA mensual",
        "F29 y F22",
        "Soporte por email"
      ],
      cta: "Solicitar Cotización",
      highlighted: false
    },
    {
      name: "Pyme",
      price: "$149.990",
      period: "mensual",
      description: "El más popular",
      features: [
        "Contabilidad completa",
        "Hasta 10 trabajadores",
        "Todas las declaraciones",
        "Liquidaciones de sueldo",
        "Asesoría tributaria",
        "Reuniones mensuales"
      ],
      cta: "Solicitar Cotización",
      highlighted: true
    },
    {
      name: "Empresa",
      price: "A convenir",
      period: "",
      description: "Soluciones a medida",
      features: [
        "Contabilidad full service",
        "Trabajadores ilimitados",
        "Outsourcing completo",
        "Asesoría permanente",
        "Reportes personalizados",
        "Ejecutivo dedicado"
      ],
      cta: "Contactar",
      highlighted: false
    }
  ];

  const faqs = [
    {
      q: "¿Qué incluye el servicio de contabilidad?",
      a: "Incluye registro de facturas, libros contables (compras, ventas, honorarios), balance mensual, estado de resultados y análisis financiero. Todo lo necesario para mantener tu contabilidad al día."
    },
    {
      q: "¿Cómo funciona el servicio de remuneraciones?",
      a: "Calculamos sueldos, generamos liquidaciones, pagamos imposiciones (AFP, Fonasa/Isapre, Cesantía), y gestionamos contratos y finiquitos. Nos encargamos de toda tu área laboral."
    },
    {
      q: "¿Pueden constituir mi empresa?",
      a: "Sí, te ayudamos con todo el proceso: redacción de escritura, inscripción en Registro de Comercio, inicio de actividades en SII, obtención de patente municipal y más."
    },
    {
      q: "¿Trabajan con empresas de cualquier tamaño?",
      a: "Trabajamos con emprendedores, pymes y empresas medianas. Tenemos planes adaptados a cada etapa de crecimiento de tu negocio."
    },
    {
      q: "¿Cómo es el proceso para comenzar?",
      a: "Agenda una reunión gratuita donde evaluamos tu situación. Luego te enviamos una propuesta personalizada. Una vez aceptada, comenzamos a trabajar inmediatamente."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <CalculatorIcon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Centro Contable</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#servicios" className="text-gray-600 hover:text-gray-900">Servicios</a>
              <a href="#planes" className="text-gray-600 hover:text-gray-900">Planes</a>
              <a href="#contacto" className="text-gray-600 hover:text-gray-900">Contacto</a>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                Portal Clientes
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
              Servicios Contables Integrales
            </h1>
            <p className="text-2xl md:text-3xl text-gray-600 mb-4">
              Tu oficina contable de confianza en Chile
            </p>
            <p className="text-xl text-gray-500 mb-12 max-w-3xl mx-auto">
              Contabilidad, remuneraciones, impuestos y asesoría tributaria.
              Nos encargamos de todo para que tú te enfoques en hacer crecer tu negocio.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition-colors shadow-lg"
              >
                Solicitar Cotización
                <ArrowRightIcon className="h-5 w-5" />
              </a>
              <a
                href="tel:+56995933340"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 text-lg font-semibold rounded-lg transition-colors shadow-lg border-2 border-gray-200"
              >
                <PhoneIcon className="h-5 w-5" />
                Llamar Ahora
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="py-8 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center text-white">
                <div className="text-3xl mb-2">{benefit.emoji}</div>
                <h3 className="font-semibold text-lg">{benefit.title}</h3>
                <p className="text-blue-100 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-xl text-gray-600">
              Soluciones contables y tributarias para tu empresa
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all"
              >
                <service.icon className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planes" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Planes de Servicio
            </h2>
            <p className="text-xl text-gray-600">
              Elige el plan que mejor se adapte a tu empresa
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
                <p className={`mb-4 ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-lg ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>
                      /{plan.period}
                    </span>
                  )}
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
                <a
                  href="#contacto"
                  className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-colors ${plan.highlighted
                    ? 'bg-white text-blue-600 hover:bg-gray-100'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 mt-8">
            * Los precios no incluyen IVA. Todos los planes incluyen acceso al Portal de Clientes.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-xl text-gray-600">
              Resolvemos tus dudas
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-100 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                  <span className="text-2xl text-gray-400">{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className="px-6 py-4 bg-white border-t border-gray-200">
                    <p className="text-gray-700">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-bold mb-6">Contáctanos</h2>
              <p className="text-gray-300 mb-8 text-lg">
                Agenda una reunión gratuita y conversemos sobre cómo podemos ayudarte con la gestión contable de tu empresa.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <PhoneIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Teléfono</p>
                    <p className="text-xl font-semibold">+56 9 9593 3340</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <EnvelopeIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-xl font-semibold">contacto@centrocontable.cl</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <MapPinIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Dirección</p>
                    <p className="text-xl font-semibold">Santiago, Chile</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white text-gray-900 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6">Solicita tu Cotización</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+56 9 XXXX XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Cuéntanos sobre tu empresa y qué servicios necesitas..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Enviar Solicitud
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <CalculatorIcon className="h-6 w-6 text-blue-400" />
              <span className="font-bold">Centro Contable</span>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Centro Contable. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-gray-400">
              <Link href="/login" className="hover:text-white">Portal Clientes</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
