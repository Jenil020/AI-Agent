import axios from "axios";

export async function getPollinationsText(message: string): Promise<string> {
  // Construct the URL using the prompt – Pollinations expects the prompt in the path.
  const url = `https://text.pollinations.ai/${encodeURIComponent(message)}`;
  try {
    const response = await axios.get(url);

    // Assuming the API returns the generated text directly in response.data
    return response.data;
  } catch (error) {
    console.error("Error fetching text from Pollinations:", error);
    return "Sorry, I couldn't generate a response.";
  }
}
