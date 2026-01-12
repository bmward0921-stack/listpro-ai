import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const platforms = [
  {
    name: "FB Marketplace",
    url: "https://www.facebook.com/marketplace/create/item",
    color: "bg-blue-600 hover:bg-blue-700",
  },
  {
    name: "Poshmark",
    url: "https://poshmark.com/create-listing",
    color: "bg-red-500 hover:bg-red-600",
  },
  {
    name: "eBay",
    url: "https://www.ebay.com/sl/sell",
    color: "bg-yellow-500 hover:bg-yellow-600 text-black",
  },
  {
    name: "Mercari",
    url: "https://www.mercari.com/sell/",
    color: "bg-red-600 hover:bg-red-700",
  },
];

const Index = () => {
  const openPlatform = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">Welcome to StockSync</h1>
          <p className="text-xl text-muted-foreground">
            Manage and cross-list your inventory across platforms
          </p>
        </div>
      </div>

      <div className="border-t bg-muted/30 p-4">
        <p className="mb-3 text-center text-sm text-muted-foreground">
          Quick List to Platform
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {platforms.map((platform) => (
            <Button
              key={platform.name}
              size="sm"
              className={`${platform.color} text-white`}
              onClick={() => openPlatform(platform.url)}
            >
              {platform.name}
              <ExternalLink className="ml-1.5 h-3 w-3" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
