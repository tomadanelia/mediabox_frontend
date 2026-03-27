const Footer = () => {
  const columns = [
    {
      title: "About",
      links: [
        { label: "Our Story", href: "/about" },
        { label: "შეხვედრა ჩვენთან", href: "/meet-us" },
        { label: "კარიერა", href: "/careers" },
        { label: "Press", href: "/press" },
      ],
    },
    {
      title: "Channels",
      links: [
        { label: "პირდაპირი ეთერი", href: "/channels/live" },
        { label: "არხების გიდი", href: "/channels/guide" },
        { label: "სპორტი", href: "/channels/sports" },
        { label: "ახალი ამბები", href: "/channels/news" },
      ],
    },
    {
      title: "Radio",
      links: [
        { label: "სტრიმი", href: "/radio" },
        { label: "სადგური", href: "/radio/stations" },
        { label: "პოდკასტები", href: "/radio/podcasts" },
        { label: "Top Charts", href: "/radio/charts" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "დახმარების ცენტრი", href: "/support" },
        { label: "კონტაქტი", href: "/support/contact" },
        { label: "ხშირად დასმული კითხვები", href: "/support/faq" },
        { label: "ხარვეზი", href: "/support/report" },
      ],
    },
  ];

  const socials = [
    {
      label: "Facebook",
      href: "https://facebook.com",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      label: "X",
      href: "https://x.com",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.25 2.25h6.925l4.26 5.632 4.809-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      label: "YouTube",
      href: "https://youtube.com",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      label: "Instagram",
      href: "https://instagram.com",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
    },
  ];

  const bottomLinks = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Our History", href: "/history" },
    { label: "What We Do", href: "/about#what-we-do" },
  ];

  return (
    <footer className="bg-background border-t border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 font-sans transition-colors duration-300 w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        <div className="grid grid-cols-12 gap-8">

          {/* ── Brand + Nav (left 8 cols) ── */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-12 gap-8">

            {/* Brand */}
            <div className="col-span-12 sm:col-span-4 flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold text-gray-900 dark:text-white leading-none">
                  Media<span className="text-red-500">Box</span>
                </span>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                Live TV channels & streaming radio — anytime, anywhere.
              </p>

              {/* Live badge */}
              <div className="inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-full px-2.5 py-1 w-fit">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                </span>
                <span className="text-[10px] text-red-500 dark:text-red-400 font-medium">Live Now</span>
              </div>

              {/* Socials */}
              <div className="flex items-center gap-1.5">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-400 dark:text-gray-500 hover:bg-red-500 hover:border-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:border-red-500 dark:hover:text-white transition-all duration-200"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Nav columns */}
            <div className="col-span-12 sm:col-span-8 grid grid-cols-4 gap-4">
              {columns.map((col) => (
                <div key={col.title}>
                  <h4 className="text-[10px] font-bold text-gray-900 dark:text-gray-200 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    {col.title}
                  </h4>
                  <ul className="space-y-2">
                    {col.links.map(({ label, href }) => (
                      <li key={label}>
                        <a
                          href={href}
                          className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-150"
                        >
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

          </div>

          {/* ── Contact + Map (right 4 cols) ── */}
          <div className="hidden lg:flex lg:col-span-4 flex-col gap-4">
            <h4 className="text-[10px] font-bold text-gray-900 dark:text-gray-200 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              Contact
            </h4>

            {/* Contact info */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-3.5 flex flex-col gap-2.5 text-xs text-gray-500 dark:text-gray-400">
              {[
                {
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  ),
                  text: "+1 (555) 000-0000",
                  href: "tel:+15550000000",
                },
                {
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  ),
                  text: "hello@mediabox.com",
                  href: "mailto:hello@mediabox.com",
                },
                {
                  icon: (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </>
                  ),
                  text: "123 Broadcast Ave, Media City",
                  href: "https://maps.google.com/?q=42.259697,42.672130",
                },
              ].map(({ icon, text, href }) => (
                <a
                  key={text}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-2.5 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-150"
                >
                  <span className="w-6 h-6 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 text-red-500 dark:text-red-400">
                      {icon}
                    </svg>
                  </span>
                  {text}
                </a>
              ))}
            </div>

            {/* Map */}
            <div className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5" style={{ height: "120px" }}>
              <iframe
                title="Office Location"
                width="100%"
                height="120"
                style={{ border: 0, display: "block", filter: "grayscale(80%) contrast(1.05) brightness(1.05)" }}
                loading="lazy"
                className="dark:[filter:grayscale(100%)_brightness(0.35)_contrast(1.2)]"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://maps.google.com/maps?q=42.259697,42.672130&z=16&output=embed"
              />
              
              {/* Our Office pill */}
              <div className="absolute top-2 left-2 bg-white/90 dark:bg-[#21262c]/90 backdrop-blur-sm text-gray-600 dark:text-gray-300 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-gray-100 dark:border-white/10 flex items-center gap-1 z-10">
                <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                Our Office
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="border-t border-gray-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center text-xs text-gray-400 dark:text-gray-500">
            {bottomLinks.map(({ label, href }, i) => (
              <span key={label} className="flex items-center">
                <a
                  href={href}
                  className="hover:text-red-500 dark:hover:text-red-400 transition-colors duration-150 px-2 py-0.5 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  {label}
                </a>
                {i < bottomLinks.length - 1 && <span className="text-gray-200 dark:text-white/10">·</span>}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} MediaBox. All rights reserved.
          </p>
        </div>
      </div>

    </footer>
  );
};

export default Footer;