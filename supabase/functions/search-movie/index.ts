import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, year, imdbId } = await req.json();
    
    if (!title && !imdbId) {
      return new Response(
        JSON.stringify({ error: 'Title or IMDb ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const omdbApiKey = Deno.env.get('OMDB_API_KEY');
    
    if (!omdbApiKey) {
      console.error('OMDB_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'OMDb API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Searching for movie:', imdbId ? `IMDb ID: ${imdbId}` : `${title}${year ? ` (${year})` : ''}`);
    
    let omdbUrl = `https://www.omdbapi.com/?apikey=${omdbApiKey}`;
    if (imdbId) {
      omdbUrl += `&i=${encodeURIComponent(imdbId)}`;
    } else {
      omdbUrl += `&t=${encodeURIComponent(title)}`;
      if (year) {
        omdbUrl += `&y=${encodeURIComponent(year)}`;
      }
    }
    
    const response = await fetch(omdbUrl);
    
    if (!response.ok) {
      console.error('OMDb API response not ok:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from OMDb API' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const data = await response.json();
    
    console.log('OMDb API response:', data);
    
    if (data.Response === 'False') {
      return new Response(
        JSON.stringify({ error: data.Error || 'Movie not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Transform the OMDb response to match our expected format
    const movieData = {
      title: data.Title,
      release_year: data.Year,
      genre: data.Genre,
      imdb_score: data.imdbRating,
      rotten_tomatoes_rating: data.Ratings?.find((r: any) => r.Source === 'Rotten Tomatoes')?.Value || 'N/A',
      rated: data.Rated,
      poster_url: data.Poster !== 'N/A' ? data.Poster : null,
      plot: data.Plot,
      actors: data.Actors !== 'N/A' ? data.Actors : null,
      directors: data.Director !== 'N/A' ? data.Director : null,
      imdb_id: data.imdbID || null
    };

    return new Response(
      JSON.stringify(movieData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in search-movie function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});