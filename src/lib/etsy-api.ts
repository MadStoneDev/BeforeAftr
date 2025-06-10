interface EtsyProfile {
  id: string;
  encrypted_access_token: string;
  encrypted_refresh_token: string;
  token_expires_at: string;
  store_id: string;
  scope: string;
}

export async function validateEtsyToken(
  profile: EtsyProfile,
): Promise<boolean> {
  const expiresAt = new Date(profile.token_expires_at);
  const now = new Date();

  // Check if token expires within the next hour
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  return expiresAt > oneHourFromNow;
}

export async function syncEtsyOrders(
  supabase: any,
  profile: EtsyProfile,
): Promise<void> {
  try {
    // This would implement the actual Etsy API calls
    // For now, this is a placeholder
    console.log("Syncing Etsy orders for store:", profile.store_id);

    // Example implementation:
    // 1. Decrypt access token
    // 2. Call Etsy API to get orders
    // 3. For each order, check if it exists in our database
    // 4. If not, insert new order record
  } catch (error) {
    console.error("Error syncing Etsy orders:", error);
    throw error;
  }
}

export async function getEtsyProducts(): Promise<
  Array<{ id: string; title: string }>
> {
  try {
    // This would implement the actual Etsy API call to get products
    // For now, return dummy data for testing
    return [
      { id: "1", title: "Premium Business Cards" },
      { id: "2", title: "Photo Prints 4x6" },
      { id: "3", title: "A4 Poster Prints" },
      { id: "4", title: "Custom Wedding Invitations" },
      { id: "5", title: "Personalized Magnets" },
      { id: "6", title: "Photo Booth Strips" },
      { id: "7", title: "Thank You Cards" },
      { id: "8", title: "Save the Date Cards" },
    ];
  } catch (error) {
    console.error("Error fetching Etsy products:", error);
    return [];
  }
}

// When you implement the real Etsy API integration, it would look something like:
/*
export async function getEtsyProducts(): Promise<Array<{id: string, title: string}>> {
  try {
    const supabase = createClientComponentClient();
    
    // Get the encrypted access token from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('encrypted_access_token, store_id')
      .single();

    if (!profile) {
      throw new Error('No Etsy profile found');
    }

    // Decrypt the access token (you'll need to implement decryption)
    const accessToken = decryptAccessToken(profile.encrypted_access_token);

    // Call Etsy API to get shop listings
    const response = await fetch(`https://openapi.etsy.com/v3/application/shops/${profile.store_id}/listings/active`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-api-key': process.env.ETSY_API_KEY!
      }
    });

    if (!response.ok) {
      throw new Error(`Etsy API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.results.map((listing: any) => ({
      id: listing.listing_id.toString(),
      title: listing.title
    }));
  } catch (error) {
    console.error('Error fetching Etsy products:', error);
    return [];
  }
}
*/
