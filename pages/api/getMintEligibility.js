import { supabase } from "../../supabaseClient";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { data, error } = await supabase
        .from("premint_userdata")
        .select("isMinted, amount")
        .eq("wallet_address", req.body.address);
      if (!error) {
        res.status(200).json({ data });
      }
      res.status(500).json({ message: "Error getting eligibility", error });
    } else {
      res.status(401).json({ message: "Invalid method" });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Internal Server Error1", e });
  }
}
