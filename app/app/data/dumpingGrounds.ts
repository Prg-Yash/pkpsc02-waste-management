/**
 * Dumping grounds / waste disposal facilities data
 */

export interface DumpingGround {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: "Transfer Station" | "Processing Center" | "Recycling Center" | "Landfill";
  acceptedWaste: string[];
  openHours: string;
  contact?: string;
}

// Major waste disposal facilities in Mumbai
export const DUMPING_GROUNDS: DumpingGround[] = [
  {
    id: "1",
    name: "Deonar Dumping Ground",
    address: "Deonar, Mumbai, Maharashtra 400088",
    latitude: 19.0501,
    longitude: 72.9122,
    type: "Landfill",
    acceptedWaste: ["Mixed", "Organic", "Plastic", "Paper"],
    openHours: "24/7",
    contact: "+91-22-2556-xxxx",
  },
  {
    id: "2",
    name: "Kanjurmarg Dumping Ground",
    address: "Kanjurmarg East, Mumbai, Maharashtra 400042",
    latitude: 19.1287,
    longitude: 72.9342,
    type: "Landfill",
    acceptedWaste: ["Mixed", "Organic", "Plastic", "Paper", "Metal"],
    openHours: "6:00 AM - 10:00 PM",
    contact: "+91-22-2578-xxxx",
  },
  {
    id: "3",
    name: "Mulund Dumping Ground",
    address: "Mulund West, Mumbai, Maharashtra 400080",
    latitude: 19.1722,
    longitude: 72.9558,
    type: "Landfill",
    acceptedWaste: ["Mixed", "Organic", "Construction"],
    openHours: "24/7",
    contact: "+91-22-2564-xxxx",
  },
  {
    id: "4",
    name: "Gorai Waste Processing Center",
    address: "Gorai, Borivali West, Mumbai, Maharashtra 400091",
    latitude: 19.2333,
    longitude: 72.8167,
    type: "Processing Center",
    acceptedWaste: ["Organic", "Biodegradable"],
    openHours: "7:00 AM - 7:00 PM",
    contact: "+91-22-2869-xxxx",
  },
  {
    id: "5",
    name: "Bhandup Recycling Center",
    address: "Bhandup West, Mumbai, Maharashtra 400078",
    latitude: 19.1456,
    longitude: 72.9394,
    type: "Recycling Center",
    acceptedWaste: ["Plastic", "Paper", "Metal", "Glass", "Electronic"],
    openHours: "8:00 AM - 6:00 PM",
    contact: "+91-22-2594-xxxx",
  },
  {
    id: "6",
    name: "Malad Transfer Station",
    address: "Malad West, Mumbai, Maharashtra 400064",
    latitude: 19.1868,
    longitude: 72.8481,
    type: "Transfer Station",
    acceptedWaste: ["Mixed", "Organic", "Plastic", "Paper"],
    openHours: "6:00 AM - 11:00 PM",
    contact: "+91-22-2881-xxxx",
  },
  {
    id: "7",
    name: "Worli Waste Collection Center",
    address: "Worli, Mumbai, Maharashtra 400018",
    latitude: 19.0176,
    longitude: 72.8181,
    type: "Transfer Station",
    acceptedWaste: ["All types"],
    openHours: "24/7",
    contact: "+91-22-2497-xxxx",
  },
  {
    id: "8",
    name: "Chembur Recycling Facility",
    address: "Chembur East, Mumbai, Maharashtra 400071",
    latitude: 19.0596,
    longitude: 72.8997,
    type: "Recycling Center",
    acceptedWaste: ["Plastic", "Paper", "Metal", "Glass"],
    openHours: "8:00 AM - 8:00 PM",
    contact: "+91-22-2527-xxxx",
  },
];
