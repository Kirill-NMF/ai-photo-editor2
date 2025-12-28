import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Zap, Image as ImageIcon, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background -z-10" />
          
          <div className="max-w-7xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              AI-Powered Photo Editing
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Transform Your Photos with
              <span className="text-primary"> AI Magic</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Describe what you want in plain English and watch our AI transform your images instantly.
              No complex tools, just your imagination.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/onboarding">
                <Button size="lg" className="text-lg h-12 px-8" data-testid="button-get-started">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="text-lg h-12 px-8" data-testid="button-try-editor">
                  Try Editor
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">1. Upload Your Image</h3>
                <p className="text-muted-foreground">
                  Drag and drop or select any image from your device. Supports JPEG, PNG, and WebP formats.
                </p>
              </Card>
              
              <Card className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">2. Describe Your Vision</h3>
                <p className="text-muted-foreground">
                  Tell our AI what you want in natural language. Make the sky dramatic, add warm tones, or any creative idea.
                </p>
              </Card>
              
              <Card className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">3. Get Instant Results</h3>
                <p className="text-muted-foreground">
                  Watch as AI transforms your image in seconds. Apply multiple edits sequentially and save your favorites.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 flex gap-4 hover-elevate">
                <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Sequential Editing</h3>
                  <p className="text-sm text-muted-foreground">
                    Apply multiple AI transformations one after another, building on previous results.
                  </p>
                </div>
              </Card>
              
              <Card className="p-6 flex gap-4 hover-elevate">
                <ImageIcon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Edit History</h3>
                  <p className="text-sm text-muted-foreground">
                    Track every transformation with full history. Return to any version at any time.
                  </p>
                </div>
              </Card>
              
              <Card className="p-6 flex gap-4 hover-elevate">
                <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Smart Suggestions</h3>
                  <p className="text-sm text-muted-foreground">
                    Get personalized prompt suggestions based on your editing style and preferences.
                  </p>
                </div>
              </Card>
              
              <Card className="p-6 flex gap-4 hover-elevate">
                <Zap className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Personal Gallery</h3>
                  <p className="text-sm text-muted-foreground">
                    Save your best edits to a personal gallery with before/after comparison.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-primary/5">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">Ready to Transform Your Photos?</h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of creators using AI to enhance their images in seconds.
            </p>
            <Link href="/onboarding">
              <Button size="lg" className="text-lg h-12 px-8" data-testid="button-cta-bottom">
                <Sparkles className="h-5 w-5 mr-2" />
                Start Editing Now
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
