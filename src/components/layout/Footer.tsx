const FOOTER_LINKS = ['About', 'Privacy', 'Terms', 'Contact'] as const;

export const Footer = () => (
  <footer className="bg-butter-accent/30 py-12 px-6 border-t border-butter-accent">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-butter-primary rounded-full flex items-center justify-center text-white font-serif italic text-sm">
          B
        </div>
        <span className="font-serif text-xl font-bold tracking-tight">Butter</span>
      </div>

      <div className="flex gap-8 text-[10px] uppercase tracking-widest font-bold text-butter-muted">
        {FOOTER_LINKS.map((link) => (
          <a key={link} href="#" className="hover:text-butter-text">
            {link}
          </a>
        ))}
      </div>

      <p className="text-[10px] uppercase tracking-widest font-bold text-butter-muted">
        © 2023 Butter Literary. All rights reserved.
      </p>
    </div>
  </footer>
);
