import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, Sparkles, ArrowLeft, CheckCircle2, Clock } from "lucide-react";

interface FeatureHighlight {
  title: string;
  description: string;
}

interface UpcomingFinancialFeatureProps {
  title: string;
  type: "income" | "expenses";
  icon: LucideIcon;
  description: string;
  highlights: FeatureHighlight[];
  onBackToPortfolio: () => void;
}

const UpcomingFinancialFeature = ({
  title,
  type,
  icon: Icon,
  description,
  highlights,
  onBackToPortfolio,
}: UpcomingFinancialFeatureProps) => {
  const iconBgColor = type === "income" 
    ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20" 
    : "bg-rose-500/10 text-rose-500 dark:bg-rose-500/20";

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="text-center pb-2 pt-10">
        <div className="flex justify-center mb-4">
          <Badge variant="secondary" className="px-3 py-1 gap-1.5 text-xs font-medium border border-border">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Upcoming Feature • In Active Development
          </Badge>
        </div>
        <div className="flex justify-center mb-4">
          <div className={`p-4 rounded-2xl ${iconBgColor} ring-1 ring-border/50`}>
            <Icon className="w-10 h-10" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
        <CardDescription className="max-w-xl mx-auto text-sm text-muted-foreground mt-2 leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 pb-10 max-w-3xl mx-auto space-y-8">
        <div>
          <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-4 flex items-center gap-1.5 justify-center sm:justify-start">
            <Clock className="w-3.5 h-3.5" />
            Planned Capabilities & Roadmap
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {highlights.map((highlight, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-lg bg-muted/40 border border-border/60 hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-sm leading-snug">{highlight.title}</h5>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {highlight.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-secondary/30 border border-border">
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium">Looking to manage your portfolio in the meantime?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track multi-asset investments, historical valuations, and returns on the Portfolio dashboard.
            </p>
          </div>
          <Button onClick={onBackToPortfolio} variant="default" className="shrink-0 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolio
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingFinancialFeature;
