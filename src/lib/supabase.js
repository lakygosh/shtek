import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://tttxczeblzplkanjowuv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0dHhjemVibHpwbGthbmpvd3V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2OTU0MTUsImV4cCI6MjA4OTI3MTQxNX0.LFE-vVRvK4bm4CL2_r7Fw5yQZRMnnv4jSmTSshGDWkI"
);
