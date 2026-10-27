// Curated Lucide icon library. Keep names aligned with lucide-react exports.
export const ICON_CATEGORIES = [
  { id:"popular", label:"Popular", icons:["BookOpen","Dumbbell","Brain","Rocket","Target","Flame","Camera","Cpu","Smartphone","Gamepad2","Gauge","Trophy"] },
  { id:"work", label:"Work & Business", icons:["Briefcase","DollarSign","PiggyBank","TrendingUp","ChartNoAxesColumnIncreasing","ChartColumnIncreasing","Presentation","Handshake","Building2","Store","Package","Workflow","ClipboardList","Files"] },
  { id:"learning", label:"Learning & Mind", icons:["BookOpen","Book","Library","GraduationCap","Brain","Lightbulb","NotebookPen","Pencil","Languages","Search","FileText","School","Quote","Puzzle"] },
  { id:"fitness", label:"Fitness & Health", icons:["Dumbbell","Activity","Heart","HeartPulse","PersonStanding","Bike","Footprints","Gauge","Timer","Apple","Droplets","Bed","BicepsFlexed","Weight","Cross"] },
  { id:"outdoors", label:"Outdoors & Adventure", icons:["Mountain","Map","Compass","Backpack","TentTree","Trees","Route","MapPin","Navigation","Sun","Moon","CloudSun","Binoculars","Flag"] },
  { id:"content", label:"Content & Creative", icons:["Video","Camera","Clapperboard","Mic","Music","Image","PanelsTopLeft","Palette","PaintBucket","Sparkles","PenTool","Podcast","Megaphone","Radio"] },
  { id:"tech", label:"Tech & Systems", icons:["Cpu","Code","Terminal","Laptop","Smartphone","Database","Server","Bot","Wifi","Settings","Wrench","Cog","Blocks","GitBranch"] },
  { id:"execution", label:"Goals & Execution", icons:["Target","Rocket","Zap","Flame","Trophy","Star","Flag","CheckCheck","ListTodo","CalendarCheck","CalendarRange","Clock","AlarmClock","CircleCheckBig","Crosshair"] },
  { id:"life", label:"Life & Home", icons:["Home","Bed","Coffee","CookingPot","ShoppingCart","Shirt","Car","WalletCards","KeyRound","Hammer","Sparkles","Calendar","Bell","Gift","Utensils"] },
  { id:"people", label:"People & Communication", icons:["Users","UserRound","MessageCircle","MessagesSquare","Phone","Mail","Handshake","HeartHandshake","Contact","Send","AtSign","Share2"] },
  { id:"symbols", label:"Symbols & Status", icons:["ShieldCheck","Shield","Swords","TriangleAlert","CircleAlert","Info","Eye","Lock","Unlock","Award","Crown","Gem","Hexagon","Infinity"] },
];

export const POPULAR_ICONS = ICON_CATEGORIES[0].icons;
export const ICON_LIBRARY = [...new Set(ICON_CATEGORIES.flatMap(c=>c.icons))];
export const findIconCategory = name => ICON_CATEGORIES.find(c=>c.icons.includes(name))?.id || "symbols";
