// ==================== COMPLETE SUPABASE SERVICE - NEW REGISTRATION SYSTEM ====================
import { supabase } from "./supabaseClient";
import bcrypt from "bcryptjs";

// ==================== TEXT FORMATTING HELPERS ====================

export const textFormatting = {
  // Capitalize first letter of each word
  capitalizeName(text) {
    if (!text) return "";
    return text
      .trim()
      .split(" ")
      .map((word) => {
        if (!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  },

  // Lowercase email
  formatEmail(email) {
    if (!email) return "";
    return email.trim().toLowerCase();
  },
};

// ==================== PASSWORD VALIDATION ====================

export const passwordValidation = {
  // Validate password complexity
  validate(password) {
    const errors = [];

    if (password.length < 10) {
      errors.push("Password must be at least 10 characters long");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;`~]/.test(password)) {
      errors.push(
        'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>_-+=[]\\/;`~)'
      );
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  },

  // Get password strength indicator
  getStrength(password) {
    let strength = 0;

    if (password.length >= 10) strength++;
    if (password.length >= 14) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;`~]/.test(password)) strength++;
    if (password.length >= 18) strength++;

    if (strength <= 2) return "weak";
    if (strength <= 4) return "medium";
    if (strength <= 5) return "strong";
    return "very strong";
  },
};

// ==================== AUTHENTICATION SERVICE ====================

export const authService = {
  // Self-registration (creates new organization)
  // NOTE: Self-registration is disabled. Organizations are created manually by Universal Hazard.
  // Users can only register via admin invitation.

  // Admin creates invitation for new user
  async createUserInvitation({
    firstName,
    lastName,
    email,
    phone,
    role = "end_user",
  }) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      // Check if user is admin
      const { data: adminProfile } = await supabase
        .from("users")
        .select("role, organization_id")
        .eq("id", user.id)
        .single();

      if (adminProfile.role !== "admin") {
        return {
          success: false,
          error: "Only administrators can invite users",
        };
      }

      // Generate invitation code
      const invitationCode =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to complete

      // Create invitation
      const { data: invitation, error: invError } = await supabase
        .from("onboarding_invitations")
        .insert({
          organization_id: adminProfile.organization_id,
          email: email,
          first_name: firstName,
          last_name: lastName || "",
          phone: phone,
          role: role,
          invited_by: user.id,
          invitation_code: invitationCode,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (invError) throw invError;

      // TODO: Send email to user with invitation link
      // The link would be: https://your-app.com/complete-registration?code=INVITATION_CODE

      return {
        success: true,
        invitation: invitation,
        invitationLink: `${window.location.origin}/complete-registration?code=${invitationCode}`,
        message: `Invitation sent to ${email}. They have 7 days to complete their profile.`,
      };
    } catch (error) {
      console.error("Create invitation error:", error);
      return { success: false, error: error.message };
    }
  },

  // User completes registration from invitation
  async completeInvitation({ invitationCode, password, confirmPassword }) {
    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        return { success: false, error: "Passwords do not match" };
      }

      // Validate password complexity
      const passwordCheck = passwordValidation.validate(password);
      if (!passwordCheck.valid) {
        return { success: false, error: passwordCheck.errors.join(". ") };
      }

      // Get invitation
      const { data: invitation, error: invError } = await supabase
        .from("onboarding_invitations")
        .select("*")
        .eq("invitation_code", invitationCode)
        .is("used_at", null)
        .single();

      if (invError || !invitation) {
        return { success: false, error: "Invalid or expired invitation code" };
      }

      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        return { success: false, error: "This invitation has expired" };
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("User creation failed");

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .insert({
          id: user.id,
          email: invitation.email,
          password_hash: passwordHash,
          first_name: invitation.first_name,
          last_name: invitation.last_name || "",
          organization_id: invitation.organization_id,
          role: invitation.role,
          phone: invitation.phone,
          status: "active",
          profile_completed: true,
          profile_completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Create notification settings
      await supabase.from("user_notification_settings").insert({
        user_id: user.id,
        email_enabled: true,
        sms_enabled: true,
        push_enabled: true,
        incidents_enabled: true,
        team_updates_enabled: true,
        admin_can_override: true,
      });

      // Mark invitation as used
      await supabase
        .from("onboarding_invitations")
        .update({
          used_at: new Date().toISOString(),
          used_by: user.id,
        })
        .eq("id", invitation.id);

      return {
        success: true,
        user: authData.user,
        profile: profile,
        message: "Your account has been created successfully!",
      };
    } catch (error) {
      console.error("Complete invitation error:", error);
      return { success: false, error: error.message };
    }
  },

  // Verify invitation code (before showing completion form)
  async verifyInvitationCode(invitationCode) {
    try {
      const { data, error } = await supabase
        .from("onboarding_invitations")
        .select("*")
        .eq("invitation_code", invitationCode)
        .is("used_at", null)
        .single();

      if (error || !data) {
        return { success: false, error: "Invalid invitation code" };
      }

      if (new Date(data.expires_at) < new Date()) {
        return { success: false, error: "This invitation has expired" };
      }

      return {
        success: true,
        invitation: {
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone,
          expiresAt: data.expires_at,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Login
  async login(email, password) {
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

      if (authError) throw authError;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select(
          `
          *,
          organization:organizations(name, logo_url)
        `
        )
        .eq("id", authData.user.id)
        .single();

      if (profileError) throw profileError;

      // Get notification settings
      const { data: notifSettings } = await supabase
        .from("user_notification_settings")
        .select("*")
        .eq("user_id", authData.user.id)
        .single();

      return {
        success: true,
        user: authData.user,
        profile: {
          ...profile,
          fullName: `${profile.first_name} ${profile.last_name}`.trim(),
          organization_name: profile.organization?.name || "Your Organization",
          department_logo: profile.organization?.logo_url || "",
          notifications: notifSettings || {},
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  },

  // Logout
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  },
};

// ==================== PROFILE MANAGEMENT ====================

export const profileService = {
  // Update user profile
  async updateProfile({ firstName, lastName, phone, rank }) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const updates = {};
      if (firstName) updates.first_name = firstName;
      if (lastName !== undefined) updates.last_name = lastName;
      if (phone) updates.phone = phone;
      if (rank) updates.rank = rank;

      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, profile: data };
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, error: error.message };
    }
  },

  // Upload profile picture
  async uploadProfilePicture(file) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("user-files")
        .getPublicUrl(filePath);

      // Update user profile with picture URL
      const { data, error } = await supabase
        .from("users")
        .update({ profile_picture_url: urlData.publicUrl })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, url: urlData.publicUrl, profile: data };
    } catch (error) {
      console.error("Upload profile picture error:", error);
      return { success: false, error: error.message };
    }
  },

  // Update notification settings
  async updateNotificationSettings(settings) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { data, error } = await supabase
        .from("user_notification_settings")
        .update(settings)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, settings: data };
    } catch (error) {
      console.error("Update notification settings error:", error);
      return { success: false, error: error.message };
    }
  },

  // Admin pushes email notification (override user settings)
  async adminPushEmailNotification(userIds, subject, message) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      // Check if user is admin
      const { data: adminProfile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (adminProfile.role !== "admin") {
        return {
          success: false,
          error: "Only administrators can push notifications",
        };
      }

      // Get users who have admin_can_override enabled (or override regardless)
      const { data: users } = await supabase
        .from("users")
        .select("email, first_name")
        .in("id", userIds);

      // TODO: Actually send emails here via email service
      // For now, just log
      console.log("Admin pushing notification to:", users);
      console.log("Subject:", subject);
      console.log("Message:", message);

      return {
        success: true,
        sentTo: users.length,
        message: `Notification sent to ${users.length} users`,
      };
    } catch (error) {
      console.error("Admin push notification error:", error);
      return { success: false, error: error.message };
    }
  },
};

// Keep existing incident and GPS services...
export const incidentService = {
  async createIncident(incidentData) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { data: userProfile } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      const { data, error } = await supabase
        .from("incidents")
        .insert({
          ...incidentData,
          organization_id: userProfile.organization_id,
          created_by: user.id,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      console.log(
        "✅ Incident saved to database:",
        data.incident_number || data.id
      );
      return { success: true, incident: data };
    } catch (error) {
      console.error("Create incident error:", error);
      return { success: false, error: error.message };
    }
  },

  async getAllIncidents() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, incidents: data };
    } catch (error) {
      console.error("Get all incidents error:", error);
      return { success: false, error: error.message };
    }
  },

  async getActiveIncidents() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, incidents: data };
    } catch (error) {
      console.error("Get active incidents error:", error);
      return { success: false, error: error.message };
    }
  },

  async getIncident(incidentId) {
    try {
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .eq("id", incidentId)
        .single();

      if (error) throw error;
      return { success: true, incident: data };
    } catch (error) {
      console.error("Get incident error:", error);
      return { success: false, error: error.message };
    }
  },

  async updateIncident(incidentId, incidentData) {
    try {
      const { error } = await supabase
        .from("incidents")
        .update({
          incident_number: incidentData.incidentNumber,
          name: incidentData.name,
          type: incidentData.type,
          search_type: incidentData.searchType,
          position: incidentData.position,
          data: incidentData.data,
          status: incidentData.status,
          leeway_calculated: incidentData.leewayCalculated || false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", incidentId);

      if (error) throw error;
      console.log("✅ Incident updated in database");
      return { success: true };
    } catch (error) {
      console.error("Update incident error:", error);
      return { success: false, error: error.message };
    }
  },

  async updateIncidentStatus(incidentId, status) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Add closed_at timestamp when closing incident
      if (status === "closed") {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("incidents")
        .update(updateData)
        .eq("id", incidentId);

      if (error) throw error;
      console.log("✅ Incident status updated:", status);
      return { success: true };
    } catch (error) {
      console.error("Update incident status error:", error);
      return { success: false, error: error.message };
    }
  },
};

export const gpsService = {
  async saveTrackPoint(
    incidentId,
    assetId,
    latitude,
    longitude,
    altitude,
    heading,
    speed
  ) {
    try {
      const { data, error } = await supabase
        .from("gps_tracks")
        .insert({
          incident_id: incidentId,
          asset_id: assetId,
          latitude,
          longitude,
          altitude,
          heading,
          speed,
          accuracy: 10,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, track: data };
    } catch (error) {
      console.error("Save track error:", error);
      return { success: false, error: error.message };
    }
  },
};

// ==================== ENVIRONMENTAL DATA SERVICE ====================
export const environmentalService = {
  async saveEnvironmentalData(incidentId, environmentalData) {
    try {
      const dbData = {
        incident_id: incidentId,
        surface_current: {
          speed: environmentalData.surfaceCurrent?.speed,
          direction: environmentalData.surfaceCurrent?.direction,
        },
        wind: {
          speed: environmentalData.wind?.speed,
          direction: environmentalData.wind?.direction,
        },
        tides: {
          height: environmentalData.tides?.height,
          phase: environmentalData.tides?.phase,
        },
        waves: {
          height: environmentalData.waves?.height,
          period: environmentalData.waves?.period,
        },
        water_temp: environmentalData.waterTemp?.value,
        air_temp: environmentalData.airTemp?.value,
        salinity: environmentalData.salinity?.value,
        visibility: environmentalData.visibility?.value,
        forecast: environmentalData.forecast?.summary,
      };

      const { error } = await supabase
        .from("environmental_data")
        .insert(dbData);

      if (error) throw error;
      console.log("✅ Environmental data saved");
      return { success: true };
    } catch (error) {
      console.error("Save environmental data error:", error);
      return { success: false, error: error.message };
    }
  },

  async getLatestEnvironmentalData(incidentId) {
    try {
      const { data, error } = await supabase
        .from("environmental_data")
        .select("*")
        .eq("incident_id", incidentId)
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Get environmental data error:", error);
      return { success: false, error: error.message };
    }
  },
};

// ==================== LEEWAY FACTORS SERVICE ====================
export const leewayService = {
  async saveLeewayFactors(incidentId, leewayData) {
    try {
      const dbData = {
        incident_id: incidentId,
        time_of_incident: leewayData.timeOfIncident,
        time_last_confirmed_alive: leewayData.timeLastConfirmedAlive,
        time_search_initiated: leewayData.timeSearchInitiated,
        remaining_daylight: leewayData.remainingDaylight,
        drift_angle: leewayData.driftAngle
          ? parseFloat(leewayData.driftAngle)
          : null,
        search_area_size: leewayData.searchAreaSize
          ? parseFloat(leewayData.searchAreaSize)
          : null,
        search_pattern: leewayData.searchPattern,
      };

      const { error } = await supabase.from("leeway_factors").insert(dbData);

      if (error) throw error;
      console.log("✅ Leeway factors saved");
      return { success: true };
    } catch (error) {
      console.error("Save leeway factors error:", error);
      return { success: false, error: error.message };
    }
  },
};

// ==================== PROBABILITY ZONES SERVICE ====================
export const zonesService = {
  async saveProbabilityZones(incidentId, driftData) {
    try {
      const zones = [
        {
          incident_id: incidentId,
          zone_number: 1,
          probability_percentage: 40,
          geometry: { type: "circle", radius: driftData.zones.high.radiusNM },
          area_nm2: Math.PI * Math.pow(driftData.zones.high.radiusNM, 2),
          color: "#FF0000",
        },
        {
          incident_id: incidentId,
          zone_number: 2,
          probability_percentage: 35,
          geometry: { type: "circle", radius: driftData.zones.medium.radiusNM },
          area_nm2: Math.PI * Math.pow(driftData.zones.medium.radiusNM, 2),
          color: "#FFA500",
        },
        {
          incident_id: incidentId,
          zone_number: 3,
          probability_percentage: 25,
          geometry: { type: "circle", radius: driftData.zones.low.radiusNM },
          area_nm2: Math.PI * Math.pow(driftData.zones.low.radiusNM, 2),
          color: "#FFFF00",
        },
      ];

      const { error } = await supabase.from("probability_zones").insert(zones);

      if (error) throw error;
      console.log("✅ Probability zones saved");
      return { success: true };
    } catch (error) {
      console.error("Save probability zones error:", error);
      return { success: false, error: error.message };
    }
  },

  async getProbabilityZones(incidentId) {
    try {
      const { data, error } = await supabase
        .from("probability_zones")
        .select("*")
        .eq("incident_id", incidentId)
        .order("zone_number");

      if (error) throw error;
      return { success: true, zones: data };
    } catch (error) {
      console.error("Get probability zones error:", error);
      return { success: false, error: error.message };
    }
  },
};

// ==================== INCIDENT COUNTER SERVICE ====================
export const counterService = {
  async getNextIncidentNumber() {
    try {
      // Call the database function that handles atomic increment
      const { data, error } = await supabase.rpc("get_next_incident_number");

      if (error) {
        console.error("Database function error:", error);
        throw error;
      }

      const incidentNumber = data;
      console.log(
        "✅ Generated incident number from database function:",
        incidentNumber
      );

      return { success: true, incidentNumber };
    } catch (error) {
      console.error("Get next incident number error:", error);
      console.warn("⚠️ Database function failed, using fallback method");

      // Fallback: Query existing incidents and increment
      try {
        const year = new Date().getFullYear();

        const { data: incidents, error: queryError } = await supabase
          .from("incidents")
          .select("incident_number")
          .like("incident_number", `${year}-%`)
          .order("incident_number", { ascending: false })
          .limit(1);

        if (queryError) throw queryError;

        let counter = 1001;

        if (incidents && incidents.length > 0) {
          const lastNumber = incidents[0].incident_number.split("-")[1];
          counter = parseInt(lastNumber) + 1;
        }

        const incidentNumber = `${year}-${String(counter).padStart(7, "0")}`;
        console.log(
          "✅ Generated incident number (fallback method):",
          incidentNumber
        );

        return { success: true, incidentNumber };
      } catch (fallbackError) {
        console.error("Fallback method also failed:", fallbackError);

        // Emergency fallback: timestamp-based
        const year = new Date().getFullYear();
        const timestamp = Date.now();
        const counter = parseInt(String(timestamp).slice(-4)) + 1001;
        const incidentNumber = `${year}-${String(counter).padStart(7, "0")}`;

        console.warn(
          "⚠️ Using timestamp-based emergency fallback:",
          incidentNumber
        );
        return { success: true, incidentNumber };
      }
    }
  },
};
