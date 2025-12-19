import { ArrowRight, Globe, Sparkles, Zap, BarChart3, FileText } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden selection:bg-primary/20">
      
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/20 blur-[120px] rounded-[100%] pointer-events-none opacity-50" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[600px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none opacity-30" />

      {/* Navbar (Simple) */}
      <header className="w-full p-6 z-50 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          ClipSEO
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Features</a>
          <a href="#" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#" className="hover:text-foreground transition-colors">Docs</a>
        </nav>
        <button className="hidden md:block px-4 py-2 rounded-full border border-border bg-background/50 hover:bg-muted transition-colors text-sm font-medium">
          Sign In
        </button>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-4 z-10 pb-20">
        
        {/* Badge */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/30 border border-border/50 text-xs font-medium text-secondary-foreground backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Next-Gen Content Intelligence</span>
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-center max-w-4xl mb-6 bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
          Turn any URL into <br />
          <span className="text-primary">SEO-Optimized Content</span>
        </h1>

        <p className="text-xl text-muted-foreground text-center max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
          ClipSEO crawls, analyzes, and rewrites existing web content to help you rank higher. Paste a link and let our AI do the heavy lifting.
        </p>

        {/* Input Area */}
        <div className="w-full max-w-2xl relative group animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
           <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
           <form className="relative flex flex-col md:flex-row items-center bg-card border border-border p-2 rounded-xl shadow-2xl">
             <div className="flex-1 flex items-center w-full px-4 h-12">
               <Globe className="w-5 h-5 text-muted-foreground mr-3" />
               <input 
                 type="url" 
                 placeholder="https://example.com/article" 
                 required
                 className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base h-full w-full"
               />
             </div>
             <button type="submit" className="w-full md:w-auto mt-2 md:mt-0 bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 rounded-lg font-semibold transition-all shadow-[0_0_20px_-5px_var(--color-primary)] hover:shadow-[0_0_25px_-5px_var(--color-primary)] flex items-center justify-center gap-2 cursor-pointer">
               Analyze <ArrowRight className="w-4 h-4" />
             </button>
           </form>
           <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-muted-foreground">
             No credit card required · Free tier available
           </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
          {[
            {
              icon: Globe,
              title: "Deep Crawling",
              desc: "Extracts core content, metadata, and keyword structures instantly from any webpage."
            },
            {
              icon: BarChart3,
              title: "Smart Analysis",
              desc: "Identifies semantic gaps, tone, and ranking opportunities using advanced NLP."
            },
            {
              icon: FileText,
              title: "Auto-Generation",
              desc: "Creates unique, high-quality articles ready for publishing in seconds."
            }
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

      </main>

      <footer className="w-full py-8 border-t border-border/40 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>© 2024 ClipSEO Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}