import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  Type,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Heart,
  CreditCard,
  Bot,
  Users,
  Home,
  UserPlus,
  Sparkles,
  MapPin,
  CircleDollarSign,
  Star,
  ArrowRight,
  Phone,
  Mail,
  Globe,
} from "lucide-react";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  useAccessibility,
  SpeakerButton,
} from "../context/AccessibilityContext";

const LandingPage = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth() || {};
  const { setPanelOpen, highContrast } = useAccessibility();
  const [roleMessage, setRoleMessage] = useState("");

  const handleEarnClick = () => {
    if (!user) {
      onNavigate("signup", "provider");
    } else if (user.role === "provider") {
      onNavigate("dashboard");
    } else {
      setRoleMessage("provider");
    }
  };

  const handleHireClick = () => {
    if (user) {
      if (user.role === "customer") {
        onNavigate("dashboard");
      } else setRoleMessage("customer");
    } else {
      onNavigate("signup", "customer");
    }
  };

  const handleRoleSwitch = async () => {
    if (!logout || !roleMessage) return;
    const targetRole = roleMessage;
    await logout();
    setRoleMessage("");
    onNavigate("signup", targetRole);
  };

  // Carousel States
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Asha Devi",
      age: 62,
      role: "Homemaker & Culinary Expert",
      quote:
        "I always loved cooking traditional meals for my family, but never imagined I could earn from it. SilverHands matched me with students and workers nearby who miss home-cooked lunches. I feel valued and financially independent.",
      impact: "Earns ₹8,500/month preparing daily regional lunches.",
      avatarBg: "bg-orange-200 text-orange-800",
    },
    {
      name: "Col. Raghavan",
      age: 69,
      role: "Retired Defense Officer",
      quote:
        "After retiring, the silence of empty days was difficult. SilverHands matched me with local micro-merchants who needed guidance on logistics and inventory. Sharing my discipline and experience has given me a fresh purpose.",
      impact: "Earns ₹14,000/month as business logistics mentor.",
      avatarBg: "bg-teal-200 text-teal-800",
    },
    {
      name: "Mrunal Patel",
      age: 55,
      role: "Homemaker & Craft Instructor",
      quote:
        "I teach traditional hand-embroidery and sewing classes to youngsters in my block on weekends. It keeps my hands active, fills my home with laughter, and helps me fund my grandson's school materials.",
      impact: "Earns ₹6,200/month running weekend craft circles.",
      avatarBg: "bg-amber-200 text-amber-800",
    },
  ];

  const handleNextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrevTestimonial = () => {
    setActiveTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  // Theming Helpers
  const bgTheme = highContrast
    ? "bg-black text-white"
    : "bg-cream text-charcoal";
  const cardTheme = highContrast
    ? "border-2 border-white bg-black"
    : "bg-white border border-cream-dark shadow-sm";
  const textSecondaryTheme = highContrast
    ? "text-gray-300"
    : "text-charcoal-light";

  const primaryBtnTheme = highContrast
    ? "border-2 border-white bg-black text-white hover:bg-white hover:text-black font-bold"
    : "bg-terracotta hover:bg-terracotta-hover text-white shadow-md hover:shadow-lg transition-all";

  const secondaryBtnTheme = highContrast
    ? "border-2 border-yellow-400 bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black font-bold"
    : "bg-forest hover:bg-forest-hover text-white shadow-md hover:shadow-lg transition-all";

  return (
    <div className={`min-h-screen font-sans ${bgTheme}`}>
      {/* 1. STICKY HEADER */}
      <header
        className={`sticky top-0 z-50 w-full border-b ${highContrast ? "border-white bg-black" : "border-cream-dark/50 bg-cream/90 backdrop-blur-md"} transition-colors`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          {/* Logo Branding */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate("landing")}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl font-serif text-xl font-extrabold ${highContrast ? "border-2 border-white bg-black text-white" : "bg-terracotta text-white"}`}
            >
              S
            </span>
            <span className="font-serif text-2xl font-bold tracking-tight">
              SilverHands
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 font-medium text-sm">
            <a
              href="#how-it-works"
              className={`hover:text-terracotta transition-colors whitespace-nowrap ${textSecondaryTheme}`}
            >
              {t("landing.how_it_works_title")}
            </a>
            <a
              href="#who-is-this-for"
              className={`hover:text-terracotta transition-colors whitespace-nowrap ${textSecondaryTheme}`}
            >
              {t("landing.designed_for_community")}
            </a>
            <a
              href="#trust"
              className={`hover:text-terracotta transition-colors whitespace-nowrap ${textSecondaryTheme}`}
            >
              {t("safety.tips.center_title")}
            </a>
          </nav>

          {/* Accessibility Controls & Actions */}
          <div className="flex items-center gap-4">
            {/* Aa Accessibility Controls */}
            <button
              onClick={() => setPanelOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all ${
                highContrast
                  ? "border-white hover:bg-white hover:text-black bg-black text-white"
                  : "border-cream-dark hover:bg-cream-dark/30 text-charcoal"
              }`}
              aria-label={t("accessibility.options")}
            >
              <Type className="h-4 w-4" />
              <span>{t("accessibility.options")}</span>
            </button>

            {/* Language Dropdown */}
            <div className="flex items-center gap-1 text-sm">
              <Globe className="h-4 w-4 text-terracotta" />
              <LanguageSwitcher />
            </div>

            {/* Get Started Button */}
            <button
              onClick={handleEarnClick}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${primaryBtnTheme}`}
            >
              {t("landing.nav_get_started")}
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          {/* Copy Writing */}
          <div className="flex flex-col gap-6 text-left">
            <h1 className="font-serif text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl flex items-center justify-between gap-3 text-left">
              <span>{t("landing.hero_title")}</span>
              <SpeakerButton
                text={t("landing.hero_title")}
                id="landing-hero-h1"
              />
            </h1>
            <div className="flex gap-3 items-start text-left">
              <p
                className={`text-lg sm:text-xl leading-relaxed grow ${textSecondaryTheme}`}
              >
                {t("landing.hero_desc")}
              </p>
              <SpeakerButton
                text={t("landing.hero_desc")}
                id="landing-hero-desc"
              />
            </div>

            {/* CTA Buttons */}
            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={handleEarnClick}
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-lg font-bold ${primaryBtnTheme}`}
              >
                {t("landing.earn_btn")}
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={handleHireClick}
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-lg font-bold ${secondaryBtnTheme}`}
              >
                {t("landing.hire_btn")}
              </button>
            </div>

            {roleMessage && (
              <div
                className={`rounded-xl border p-3 text-sm ${highContrast ? "border-white bg-black text-white" : "border-cream-dark bg-white text-charcoal"}`}
              >
                <p>{t(`landing.${roleMessage}_account_notice`)}</p>
                <button
                  onClick={handleRoleSwitch}
                  className="mt-2 font-bold text-terracotta hover:underline"
                >
                  {t(`landing.create_${roleMessage}_account`)}
                </button>
              </div>
            )}

            {/* Social Trust Line */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex -space-x-2">
                <span className="inline-block h-8 w-8 rounded-full bg-orange-400 border border-cream" />
                <span className="inline-block h-8 w-8 rounded-full bg-teal-600 border border-cream" />
                <span className="inline-block h-8 w-8 rounded-full bg-amber-500 border border-cream" />
              </div>
              <span className={`text-sm font-semibold ${textSecondaryTheme}`}>
                {t("landing.verified_members")}
              </span>
            </div>
          </div>

          {/* Warm Illustration Placeholder */}
          <div className="relative flex justify-center">
            <div
              className={`aspect-square w-full max-w-[450px] rounded-3xl overflow-hidden flex items-center justify-center ${highContrast ? "border-4 border-dashed border-white" : "bg-gradient-to-tr from-orange-100 via-amber-50 to-teal-50 border border-cream-dark"}`}
            >
              <div className="p-8 text-center flex flex-col items-center gap-4">
                <div
                  className={`h-16 w-16 rounded-full flex items-center justify-center ${highContrast ? "bg-white text-black" : "bg-terracotta text-white"}`}
                >
                  <Heart className="h-8 w-8" />
                </div>
                <span className="font-serif text-2xl font-bold">
                  {t("landing.community_support_title")}
                </span>
                <p className={`text-sm max-w-xs ${textSecondaryTheme}`}>
                  {t("landing.community_support_desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section
        id="how-it-works"
        className={`px-4 py-16 md:px-8 border-t ${highContrast ? "border-white" : "border-cream-dark/50"}`}
      >
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="font-serif text-3xl font-extrabold sm:text-4xl">
            {t("landing.how_it_works_title")}
          </h2>
          <p className={`mt-3 text-lg ${textSecondaryTheme} max-w-2xl mx-auto`}>
            {t("landing.how_it_works_desc")}
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div
              className={`relative p-6 rounded-2xl ${cardTheme} flex flex-col items-center text-center gap-4`}
            >
              <div
                className={`absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${highContrast ? "border border-white text-white" : "bg-cream-dark/30 text-charcoal"}`}
              >
                1
              </div>
              <div className="p-4 rounded-xl bg-orange-100 text-terracotta mt-4">
                <UserPlus className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">{t("landing.step1_title")}</h3>
              <p className={`text-sm ${textSecondaryTheme}`}>
                {t("landing.step1_desc")}
              </p>
            </div>

            {/* Step 2 */}
            <div
              className={`relative p-6 rounded-2xl ${cardTheme} flex flex-col items-center text-center gap-4`}
            >
              <div
                className={`absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${highContrast ? "border border-white text-white" : "bg-cream-dark/30 text-charcoal"}`}
              >
                2
              </div>
              <div className="p-4 rounded-xl bg-teal-100 text-forest mt-4">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">{t("landing.step2_title")}</h3>
              <p className={`text-sm ${textSecondaryTheme}`}>
                {t("landing.step2_desc")}
              </p>
            </div>

            {/* Step 3 */}
            <div
              className={`relative p-6 rounded-2xl ${cardTheme} flex flex-col items-center text-center gap-4`}
            >
              <div
                className={`absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${highContrast ? "border border-white text-white" : "bg-cream-dark/30 text-charcoal"}`}
              >
                3
              </div>
              <div className="p-4 rounded-xl bg-amber-100 text-amber-700 mt-4">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">{t("landing.step3_title")}</h3>
              <p className={`text-sm ${textSecondaryTheme}`}>
                {t("landing.step3_desc")}
              </p>
            </div>

            {/* Step 4 */}
            <div
              className={`relative p-6 rounded-2xl ${cardTheme} flex flex-col items-center text-center gap-4`}
            >
              <div
                className={`absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${highContrast ? "border border-white text-white" : "bg-cream-dark/30 text-charcoal"}`}
              >
                4
              </div>
              <div className="p-4 rounded-xl bg-green-100 text-green-700 mt-4">
                <CircleDollarSign className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">{t("landing.step4_title")}</h3>
              <p className={`text-sm ${textSecondaryTheme}`}>
                {t("landing.step4_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHO IS THIS FOR */}
      <section
        id="who-is-this-for"
        className={`px-4 py-16 md:px-8 border-t ${highContrast ? "border-white" : "border-cream-dark/50"}`}
      >
        <div className="mx-auto max-w-7xl">
          <h2 className="font-serif text-3xl font-extrabold text-center sm:text-4xl">
            {t("landing.designed_for_community")}
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {/* Seniors Card */}
            <div className={`p-8 rounded-3xl ${cardTheme} flex flex-col gap-6`}>
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-orange-100 text-terracotta">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="font-serif text-2xl font-bold">
                  {t("landing.seniors_title")}
                </h3>
              </div>
              <p className={textSecondaryTheme}>{t("landing.seniors_desc")}</p>
              <a
                href="#signup"
                onClick={(e) => {
                  e.preventDefault();
                  handleEarnClick();
                }}
                className="mt-4 flex items-center gap-1 font-bold text-terracotta hover:underline"
              >
                {t("landing.learn_more")} <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Homemakers Card */}
            <div className={`p-8 rounded-3xl ${cardTheme} flex flex-col gap-6`}>
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-teal-100 text-forest">
                  <Home className="h-8 w-8" />
                </div>
                <h3 className="font-serif text-2xl font-bold">
                  {t("landing.homemakers_title")}
                </h3>
              </div>
              <p className={textSecondaryTheme}>
                {t("landing.homemakers_desc")}
              </p>
              <a
                href="#signup"
                onClick={(e) => {
                  e.preventDefault();
                  handleEarnClick();
                }}
                className="mt-4 flex items-center gap-1 font-bold text-forest hover:underline"
              >
                {t("landing.learn_more")} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRUST & SAFETY STRIP */}
      <section
        id="trust"
        className={`px-4 py-12 md:px-8 border-t border-b ${highContrast ? "border-white bg-black" : "bg-cream-dark/20 border-cream-dark/50"}`}
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* ID Verified */}
            <div className="group relative flex items-center gap-3 p-4 rounded-xl cursor-default hover:bg-cream-dark/30 transition-all">
              <div className="p-3 rounded-lg bg-teal-100 text-forest">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm">
                  {t("landing.id_verified_title")}
                </h4>
                <p className={`text-xs ${textSecondaryTheme}`}>
                  {t("landing.id_verified_desc")}
                </p>
              </div>
            </div>

            {/* Community Endorsed */}
            <div className="group relative flex items-center gap-3 p-4 rounded-xl cursor-default hover:bg-cream-dark/30 transition-all">
              <div className="p-3 rounded-lg bg-orange-100 text-terracotta">
                <Heart className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm">
                  {t("landing.community_endorsed_title")}
                </h4>
                <p className={`text-xs ${textSecondaryTheme}`}>
                  {t("landing.community_endorsed_desc")}
                </p>
              </div>
            </div>

            {/* Secure Payments */}
            <div className="group relative flex items-center gap-3 p-4 rounded-xl cursor-default hover:bg-cream-dark/30 transition-all">
              <div className="p-3 rounded-lg bg-amber-100 text-amber-700">
                <CreditCard className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm">
                  {t("landing.secure_payments_title")}
                </h4>
                <p className={`text-xs ${textSecondaryTheme}`}>
                  {t("landing.secure_payments_desc")}
                </p>
              </div>
            </div>

            {/* AI Scam Detection */}
            <div className="group relative flex items-center gap-3 p-4 rounded-xl cursor-default hover:bg-cream-dark/30 transition-all">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-700">
                <Bot className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm">
                  {t("landing.ai_scam_title")}
                </h4>
                <p className={`text-xs ${textSecondaryTheme}`}>
                  {t("landing.ai_scam_desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIAL CAROUSEL */}
      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-extrabold sm:text-4xl">
            {t("landing.empowered_voices")}
          </h2>

          <div className="relative mt-12">
            {/* Carousel Navigation */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 z-10">
              <button
                onClick={handlePrevTestimonial}
                className={`p-3 rounded-full border shadow-sm transition-all ${highContrast ? "border-white bg-black hover:bg-white hover:text-black" : "border-cream-dark bg-white hover:bg-cream-dark/30 text-charcoal"}`}
                aria-label="Previous Testimonial"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-0 z-10">
              <button
                onClick={handleNextTestimonial}
                className={`p-3 rounded-full border shadow-sm transition-all ${highContrast ? "border-white bg-black hover:bg-white hover:text-black" : "border-cream-dark bg-white hover:bg-cream-dark/30 text-charcoal"}`}
                aria-label="Next Testimonial"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {/* Active Testimonial Card */}
            <div
              className={`mx-12 p-8 sm:p-12 rounded-3xl ${cardTheme} flex flex-col gap-6 text-left transition-all duration-300`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-16 w-16 rounded-full flex items-center justify-center font-serif text-2xl font-bold ${testimonials[activeTestimonial].avatarBg}`}
                >
                  {testimonials[activeTestimonial].name[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {testimonials[activeTestimonial].name}
                    <span
                      className={`text-sm font-normal ${textSecondaryTheme}`}
                    >
                      (
                      {t("dashboard.employer.candidates.age", {
                        age: testimonials[activeTestimonial].age,
                      })}
                      )
                    </span>
                  </h3>
                  <p className={`text-sm ${textSecondaryTheme}`}>
                    {testimonials[activeTestimonial].role}
                  </p>
                </div>
              </div>

              <blockquote className="font-serif text-lg sm:text-xl italic leading-relaxed text-charcoal-light">
                "{testimonials[activeTestimonial].quote}"
              </blockquote>

              <div
                className={`flex items-center gap-2 border-t pt-4 ${highContrast ? "border-white" : "border-cream-dark/50"}`}
              >
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                <span className="font-semibold text-forest text-sm sm:text-base">
                  {testimonials[activeTestimonial].impact}
                </span>
              </div>
            </div>

            {/* Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`h-3 w-3 rounded-full transition-all ${activeTestimonial === index ? "bg-terracotta w-6" : "bg-cream-dark"}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer
        className={`border-t px-4 py-12 md:px-8 ${highContrast ? "border-white bg-black" : "bg-forest text-cream border-cream-dark/30"}`}
      >
        <div className="mx-auto max-w-7xl grid gap-8 md:grid-cols-4 text-left">
          {/* Brand Info */}
          <div className="flex flex-col gap-4">
            <h2 className="font-serif text-2xl font-bold text-white">
              SilverHands
            </h2>
            <p
              className={`text-sm ${highContrast ? "text-gray-300" : "text-cream-dark"}`}
            >
              {t("landing.community_support_desc")}
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-lg font-bold text-white">
              {t("landing.platform_links")}
            </h4>
            <a
              href="#how-it-works"
              className={`text-sm hover:underline ${highContrast ? "text-gray-300" : "text-cream-dark"}`}
            >
              {t("landing.how_it_works_title")}
            </a>
            <a
              href="#who-is-this-for"
              className={`text-sm hover:underline ${highContrast ? "text-gray-300" : "text-cream-dark"}`}
            >
              {t("landing.designed_for_community")}
            </a>
            <a
              href="#trust"
              className={`text-sm hover:underline ${highContrast ? "text-gray-300" : "text-cream-dark"}`}
            >
              {t("safety.tips.center_title")}
            </a>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-lg font-bold text-white">
              {t("landing.support_contact")}
            </h4>
            <span
              className={`flex items-center gap-2 text-sm ${highContrast ? "text-gray-300" : "text-cream-dark"}`}
            >
              <Phone className="h-4 w-4" /> +91 98765 43210
            </span>
            <span
              className={`flex items-center gap-2 text-sm ${highContrast ? "text-gray-300" : "text-cream-dark"}`}
            >
              <Mail className="h-4 w-4" /> support@silverhands.org
            </span>
          </div>

          {/* Social icons */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-lg font-bold text-white">
              {t("landing.our_community")}
            </h4>
            <p
              className={`text-sm ${highContrast ? "text-gray-300" : "text-cream-dark"}`}
            >
              {t("landing.verified_members")}
            </p>
            <div className="flex gap-4 mt-2">
              <span className="h-8 w-8 rounded-full bg-cream/10 flex items-center justify-center cursor-pointer hover:bg-cream/20 text-white">
                FB
              </span>
              <span className="h-8 w-8 rounded-full bg-cream/10 flex items-center justify-center cursor-pointer hover:bg-cream/20 text-white">
                IN
              </span>
              <span className="h-8 w-8 rounded-full bg-cream/10 flex items-center justify-center cursor-pointer hover:bg-cream/20 text-white">
                YT
              </span>
            </div>
          </div>
        </div>

        <div
          className={`mx-auto max-w-7xl border-t mt-12 pt-6 text-center text-xs ${highContrast ? "border-white text-gray-400" : "border-cream-dark/20 text-cream-dark"}`}
        >
          © {new Date().getFullYear()} {t("landing.copyright")}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
