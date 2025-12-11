import React, { useState, useEffect, useRef } from "react";
import "./styles.css";
import {
  authService,
  incidentService,
  gpsService,
  passwordValidation,
  profileService,
  counterService,
} from "./supabaseService";
import { noaaService } from "./noaaService";

// ==================== ICONS ====================
const Icons = {
  NewIncident: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  JoinIncident: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
  PreviousIncidents: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  TeamManagement: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Resources: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Communications: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Reports: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Settings: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6" />
      <path d="M20.49 5.5l-4.24 4.24m-8.49 0L3.51 5.5" />
      <path d="M1 12h6m6 0h6" />
      <path d="M3.51 18.5l4.24-4.24m8.49 0l4.24 4.24" />
      <rect x="14" y="14" width="8" height="5" rx="1" strokeWidth="1.5" />
      <line x1="16" y1="17" x2="20" y2="17" strokeWidth="1.5" />
    </svg>
  ),
  Training: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  Logout: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Sun: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  Moon: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  Close: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  ),
  Send: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  ),
  Add: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  ),
  Delete: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  ),
  RescueGPSLogo: ({ size = "auto" }) => (
    <img
      src="https://universalhazard.com/wp-content/uploads/2025/11/logojason_transparent.png"
      alt="RescueGPS"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  ),
};

// ==================== MAIN APP ====================
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // LOGIN DISABLED
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewIncidentModal, setShowNewIncidentModal] = useState(false);
  const [searchType, setSearchType] = useState(null);
  const [currentView, setCurrentView] = useState("dashboard");
  const [activeIncident, setActiveIncident] = useState(null);
  const [incidents, setIncidents] = useState([]);

  // New modal states for dashboard features
  const [showPreviousIncidents, setShowPreviousIncidents] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showCommunications, setShowCommunications] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapPickerPosition, setMapPickerPosition] = useState({
    lat: 29.7604,
    lng: -95.3698,
  }); // Default Houston

  // Google Maps loading state
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Units tracking state
  const [assignedUnits, setAssignedUnits] = useState([
    // Example units - will be empty initially
    // { id: 1, name: 'CG-45210', type: 'Vessel', status: 'Searching', assignedTime: '14:30' },
  ]);
  const [stagingUnits, setStagingUnits] = useState([
    // Example staging units
    // { id: 1, name: 'CG-45211', type: 'Vessel', status: 'Staging', eta: '15:00' },
  ]);

  // Map picker refs (must be at top level for React hooks rules)
  const mapPickerMapRef = useRef(null);
  const mapPickerMarkerRef = useRef(null);

  // Main incident map refs
  const incidentMapRef = useRef(null);
  const incidentMapObjectRef = useRef(null); // Store actual map object
  const incidentMarkerRef = useRef(null);
  const drawnZonesRef = useRef([]); // Store drawn zones for cleanup

  // User data with test data
  const [userData, setUserData] = useState({
    firstName: "John",
    lastName: "Smith",
    fullName: "John Smith",
    department: "Search & Rescue Division",
    departmentLogo: null,
    rank: "Captain",
    email: "captain.smith@rescue.com",
    password: "",
    phone: "(555) 123-4567",
    profilePicture: null,
    notifications: {
      email: true,
      sms: true,
      push: true,
      incidents: true,
      teamUpdates: true,
    },
  });

  // Team data for Team Management
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: "John Smith",
      email: "john@rescue.com",
      role: "end_user",
      status: "active",
      joinedDate: "2024-01-15",
    },
    {
      id: 2,
      name: "Jane Doe",
      email: "jane@rescue.com",
      role: "end_user",
      status: "active",
      joinedDate: "2024-02-20",
    },
  ]);

  // Invitation form data
  const [invitationForm, setInvitationForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "end_user",
  });

  // Resources data
  const [resources, setResources] = useState([
    {
      id: 1,
      name: "Rescue Boat Alpha",
      type: "Watercraft",
      status: "available",
      location: "Marina Bay",
    },
    {
      id: 2,
      name: "K9 Unit Charlie",
      type: "K9",
      status: "deployed",
      location: "Grid A-4",
    },
    {
      id: 3,
      name: "Medical Kit #5",
      type: "Medical",
      status: "available",
      location: "Command Center",
    },
  ]);

  // Communications - messages
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "Command",
      text: "All units report status",
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: 2,
      sender: "Unit 5",
      text: "Unit 5 responding, ETA 10 minutes",
      timestamp: new Date(Date.now() - 240000),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  // Previous incidents data
  const [previousIncidents, setPreviousIncidents] = useState([
    {
      id: 1,
      name: "Missing Hiker - Mt. Peak",
      type: "Land Search",
      date: "2024-11-28",
      status: "closed",
      duration: "4.5 hrs",
    },
    {
      id: 2,
      name: "Capsized Vessel - Harbor",
      type: "Water Rescue",
      date: "2024-11-25",
      status: "closed",
      duration: "2.3 hrs",
    },
    {
      id: 3,
      name: "Lost Child - State Park",
      type: "Land Search",
      date: "2024-11-20",
      status: "closed",
      duration: "1.8 hrs",
    },
  ]);

  // Apply dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [isDarkMode]);

  // Get user initials
  const getUserInitials = () => {
    return `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`;
  };

  // ==================== INCIDENT NUMBERING SYSTEM ====================
  // Database-backed incident numbering - ensures sequential, no gaps, no duplicates
  const generateIncidentNumber = async () => {
    try {
      const result = await counterService.getNextIncidentNumber();
      if (result.success) {
        console.log(
          "✅ Generated incident number from database:",
          result.incidentNumber
        );
        return result.incidentNumber;
      } else {
        // Fallback to timestamp-based if database fails
        const year = new Date().getFullYear();
        const timestamp = Date.now() % 10000; // Last 4 digits
        const fallbackNumber = `${year}-${String(1000 + timestamp).padStart(
          7,
          "0"
        )}`;
        console.warn(
          "⚠️ Database numbering failed, using fallback:",
          fallbackNumber
        );
        return fallbackNumber;
      }
    } catch (error) {
      console.error("❌ Error generating incident number:", error);
      // Emergency fallback
      const year = new Date().getFullYear();
      const timestamp = Date.now() % 10000;
      return `${year}-${String(1000 + timestamp).padStart(7, "0")}`;
    }
  };

  // ==================== AUTO-SAVE INCIDENT ====================
  const handleBackToDashboard = async () => {
    if (activeIncident) {
      console.log("💾 Auto-saving incident before returning to dashboard...");

      // Update incident in incidents array
      const updatedIncidents = incidents.map((inc) =>
        inc.id === activeIncident.id ? activeIncident : inc
      );

      // If incident not in array yet, add it
      if (!incidents.find((inc) => inc.id === activeIncident.id)) {
        updatedIncidents.push(activeIncident);
      }

      setIncidents(updatedIncidents);

      // Save to database
      try {
        const result = await incidentService.updateIncident(
          activeIncident.id,
          activeIncident
        );
        if (result.success) {
          console.log(
            "✅ Incident saved to database:",
            activeIncident.incidentNumber
          );
        } else {
          console.warn(
            "⚠️ Database save failed, saved locally only:",
            result.error
          );
        }
      } catch (error) {
        console.error("❌ Auto-save error:", error);
      }
    }

    // Keep activeIncident in state so indicator shows
    // User can click indicator to return to incident
    setCurrentView("dashboard");
  };

  // ==================== END INCIDENT ====================
  const handleEndIncident = async () => {
    if (!activeIncident) return;

    // Confirm with user
    const confirmed = window.confirm(
      `End Incident: ${activeIncident.incidentNumber}?\n\n` +
        `This will mark the incident as "Closed" and move it to Previous Incidents.\n\n` +
        `The incident data will be saved and can be viewed later.\n\n` +
        `Click OK to end this incident.`
    );

    if (!confirmed) return;

    console.log("🏁 Ending incident:", activeIncident.incidentNumber);

    // Update incident status to closed
    const endedIncident = {
      ...activeIncident,
      status: "closed",
      closedAt: new Date().toISOString(),
    };

    // Update incidents array
    const updatedIncidents = incidents.map((inc) =>
      inc.id === activeIncident.id ? endedIncident : inc
    );

    setIncidents(updatedIncidents);

    // Save to database
    try {
      const result = await incidentService.updateIncidentStatus(
        activeIncident.id,
        "closed"
      );
      if (result.success) {
        console.log(
          "✅ Incident ended in database:",
          activeIncident.incidentNumber
        );
      } else {
        console.warn(
          "⚠️ Database update failed, saved locally only:",
          result.error
        );
      }
    } catch (error) {
      console.error("❌ Error ending incident:", error);
    }

    // Clear active incident and return to dashboard
    setActiveIncident(null);
    setCurrentView("dashboard");

    // Show success message
    setTimeout(() => {
      alert(
        `✅ Incident ${activeIncident.incidentNumber} has been ended.\n\nThe incident has been moved to Previous Incidents and can be accessed from the dashboard.`
      );
    }, 300);
  };

  // ==================== ENVIRONMENTAL DATA STATE ====================
  // Environmental data with station selection
  const [environmentalData, setEnvironmentalData] = useState({
    surfaceCurrent: { speed: null, direction: null, status: "loading" },
    wind: { speed: null, direction: null, status: "loading" },
    tides: { height: null, phase: null, status: "loading" },
    waves: { height: null, period: null, status: "loading" },
    waterTemp: { value: null, status: "loading" },
    airTemp: { value: null, status: "loading" },
    salinity: { value: null, status: "loading" },
    visibility: { value: null, status: "loading" },
    forecast: { summary: null, status: "loading" },
    lastUpdate: null,
  });

  const [availableStations, setAvailableStations] = useState({
    tides: [],
    currents: [],
    buoys: [],
  });

  const [selectedStation, setSelectedStation] = useState(null);
  const [showStationSelector, setShowStationSelector] = useState(false);

  const [showLeewayFactors, setShowLeewayFactors] = useState(false);
  const [leewayFactors, setLeewayFactors] = useState({
    // Auto-filled from incident
    objectType: "",
    physicalCharacteristics: "",
    // Time factors
    timeOfIncident: "",
    timeLastConfirmedAlive: "",
    timeSearchInitiated: "",
    remainingDaylight: "",
    // Additional factors
    driftAngle: "",
    searchAreaSize: "",
    searchPattern: "expanding-square",
  });

  // Fetch environmental data - Mock version for CodeSandbox
  const fetchEnvironmentalData = async (lat, lng, selectedStations = null) => {
    console.log("🌊 Fetching environmental data...");

    try {
      // Use mock realistic data (simulates successful API response)
      // In production, this would be real NOAA data
      const mockData = {
        surfaceCurrent: {
          speed: 2.3,
          direction: 180,
          status: "success",
          source: "Galveston Channel, TX",
        },
        wind: {
          speed: 15.2,
          direction: 225,
          status: "success",
          source: "NWS Houston",
        },
        tides: {
          height: 3.2,
          phase: "High Tide",
          status: "success",
          source: "Galveston Pier 21, TX",
        },
        waves: {
          height: 4.1,
          period: 6,
          status: "success",
          source: "Buoy 42035",
        },
        waterTemp: {
          value: 72,
          status: "success",
          source: "Buoy 42035",
        },
        airTemp: {
          value: 78,
          status: "success",
          source: "NWS Houston",
        },
        salinity: {
          value: null,
          status: "error",
          source: null,
        },
        visibility: {
          value: 8.5,
          status: "success",
          source: "NWS Houston",
        },
        forecast: {
          summary:
            "Partly cloudy with light winds increasing to 15-20 knots by evening. Seas 3-5 feet. Scattered showers possible after midnight.",
          status: "success",
          source: "NWS",
        },
        lastUpdate: new Date(),
      };

      console.log("✅ Environmental data loaded:", mockData);
      setEnvironmentalData(mockData);

      // Try to find nearest stations if noaaService is available
      try {
        if (noaaService && noaaService.findNearestStations) {
          const availableStations = await noaaService.findNearestStations(
            parseFloat(lat),
            parseFloat(lng),
            5
          );
          console.log("📍 Found nearest stations:", availableStations);
          setAvailableStations(availableStations);
        }
      } catch (stationError) {
        console.warn(
          "Station lookup failed, continuing without station selection:",
          stationError
        );
        // Set empty stations
        setAvailableStations({
          tides: [],
          currents: [],
          buoys: [],
        });
      }
    } catch (error) {
      console.error("❌ Error setting up environmental data:", error);

      // Fallback
      setEnvironmentalData({
        surfaceCurrent: {
          speed: 2.3,
          direction: 180,
          status: "success",
          source: "Demo Station",
        },
        wind: {
          speed: 15.2,
          direction: 225,
          status: "success",
          source: "Demo Station",
        },
        tides: {
          height: 3.2,
          phase: "High Tide",
          status: "success",
          source: "Demo Station",
        },
        waves: {
          height: 4.1,
          period: 6,
          status: "success",
          source: "Demo Station",
        },
        waterTemp: {
          value: 72,
          status: "success",
          source: "Demo Station",
        },
        airTemp: {
          value: 78,
          status: "success",
          source: "Demo Station",
        },
        salinity: {
          value: null,
          status: "error",
          source: null,
        },
        visibility: {
          value: 8.5,
          status: "success",
          source: "Demo Station",
        },
        forecast: {
          summary:
            "Partly cloudy, light winds increasing to 15 knots by evening",
          status: "success",
          source: "Demo",
        },
        lastUpdate: new Date(),
      });
    }
  };

  // ==================== REMAINING DAYLIGHT CALCULATION ====================

  // Auto-refresh environmental data every 60 seconds
  useEffect(() => {
    if (activeIncident && currentView === "incident") {
      const interval = setInterval(() => {
        fetchEnvironmentalData(
          activeIncident.position.lat,
          activeIncident.position.lng
        );
      }, 60000); // 60 seconds

      return () => clearInterval(interval);
    }
  }, [activeIncident, currentView]);

  // ==================== AUTO-SAVE TO LOCALSTORAGE ====================
  // Save incidents to localStorage whenever they change
  useEffect(() => {
    if (incidents.length > 0) {
      try {
        localStorage.setItem("rescuegps_incidents", JSON.stringify(incidents));
        console.log("💾 Incidents auto-saved to localStorage");
      } catch (error) {
        console.error("❌ Failed to save incidents to localStorage:", error);
      }
    }
  }, [incidents]);

  // Save active incident separately
  useEffect(() => {
    if (activeIncident) {
      try {
        localStorage.setItem(
          "rescuegps_active_incident",
          JSON.stringify(activeIncident)
        );
        console.log("💾 Active incident auto-saved to localStorage");
      } catch (error) {
        console.error("❌ Failed to save active incident:", error);
      }
    } else {
      localStorage.removeItem("rescuegps_active_incident");
    }
  }, [activeIncident]);

  // Load incidents from database/localStorage on startup
  useEffect(() => {
    const loadIncidents = async () => {
      try {
        // Try loading from database first
        const dbResult = await incidentService.getAllIncidents();

        if (
          dbResult.success &&
          dbResult.incidents &&
          dbResult.incidents.length > 0
        ) {
          setIncidents(dbResult.incidents);
          console.log(
            "✅ Loaded",
            dbResult.incidents.length,
            "incidents from database"
          );

          // Check for active incidents
          const activeIncidents = dbResult.incidents.filter(
            (inc) => inc.status === "active"
          );
          if (activeIncidents.length > 0) {
            // Restore the most recently updated active incident
            const mostRecent = activeIncidents.sort(
              (a, b) =>
                new Date(b.updated_at || b.created_at) -
                new Date(a.updated_at || a.created_at)
            )[0];
            setActiveIncident(mostRecent);
            setCurrentView("incident");
            console.log(
              "✅ Restored active incident from database:",
              mostRecent.incident_number
            );
          }
          return;
        }

        // Fallback to localStorage if database is empty or fails
        console.log("⚠️ Database empty or unavailable, trying localStorage...");
        const savedIncidents = localStorage.getItem("rescuegps_incidents");
        const savedActiveIncident = localStorage.getItem(
          "rescuegps_active_incident"
        );

        if (savedIncidents) {
          const parsed = JSON.parse(savedIncidents);
          setIncidents(parsed);
          console.log(
            "✅ Loaded",
            parsed.length,
            "incidents from localStorage (fallback)"
          );
        }

        if (savedActiveIncident) {
          const parsed = JSON.parse(savedActiveIncident);
          setActiveIncident(parsed);
          setCurrentView("incident");
          console.log("✅ Restored active incident from localStorage");
        }
      } catch (error) {
        console.error("❌ Failed to load incidents:", error);
        // Try localStorage as last resort
        try {
          const savedIncidents = localStorage.getItem("rescuegps_incidents");
          if (savedIncidents) {
            const parsed = JSON.parse(savedIncidents);
            setIncidents(parsed);
            console.log(
              "✅ Loaded",
              parsed.length,
              "incidents from localStorage (error fallback)"
            );
          }
        } catch (localError) {
          console.error("❌ localStorage fallback also failed:", localError);
        }
      }
    };

    loadIncidents();
  }, []); // Run once on mount

  // Listen for Google Maps loaded event
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.geometry) {
        setGoogleMapsLoaded(true);
        console.log("✅ Google Maps fully loaded and ready");
      }
    };

    // Check immediately
    checkGoogleMaps();

    // Listen for the callback event
    window.addEventListener("google-maps-loaded", checkGoogleMaps);

    // Also poll every 500ms as backup
    const pollInterval = setInterval(() => {
      if (!googleMapsLoaded) {
        checkGoogleMaps();
      } else {
        clearInterval(pollInterval);
      }
    }, 500);

    return () => {
      window.removeEventListener("google-maps-loaded", checkGoogleMaps);
      clearInterval(pollInterval);
    };
  }, [googleMapsLoaded]);

  // Map picker initialization effect
  useEffect(() => {
    if (
      showMapPicker &&
      window.google &&
      mapPickerMapRef.current &&
      !mapPickerMarkerRef.current
    ) {
      // Initialize map
      const map = new window.google.maps.Map(mapPickerMapRef.current, {
        center: mapPickerPosition,
        zoom: 13,
        mapTypeId: "hybrid",
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: false,
      });

      // Create draggable marker
      const marker = new window.google.maps.Marker({
        position: mapPickerPosition,
        map: map,
        draggable: true,
        title: "Drag to select Last Known Position",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#FF0000",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 3,
        },
      });

      mapPickerMarkerRef.current = marker;

      // Update position when marker is dragged
      marker.addListener("dragend", (event) => {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();
        setMapPickerPosition({ lat: newLat, lng: newLng });
      });

      // Allow clicking on map to move marker
      map.addListener("click", (event) => {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();
        setMapPickerPosition({ lat: newLat, lng: newLng });
        marker.setPosition(event.latLng);
      });
    }
  }, [showMapPicker, mapPickerPosition]);

  // Incident map initialization effect
  useEffect(() => {
    if (
      currentView === "incident" &&
      activeIncident &&
      incidentMapRef.current
    ) {
      // Check if Google Maps is loaded
      if (!window.google || !window.google.maps) {
        console.error("Google Maps not loaded yet");
        // Retry after a short delay
        const retryTimer = setTimeout(() => {
          if (window.google && window.google.maps) {
            initializeIncidentMap();
          }
        }, 1000);
        return () => clearTimeout(retryTimer);
      } else {
        initializeIncidentMap();
      }
    }
  }, [currentView, activeIncident]);

  const initializeIncidentMap = () => {
    if (!incidentMapRef.current || !activeIncident) return;

    try {
      // Initialize map centered on Last Known Position
      const map = new window.google.maps.Map(incidentMapRef.current, {
        center: {
          lat: parseFloat(activeIncident.position.lat),
          lng: parseFloat(activeIncident.position.lng),
        },
        zoom: 13,
        mapTypeId: "hybrid",
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: true,
      });

      // Store map object for later use
      incidentMapObjectRef.current = map;

      // Add marker for Last Known Position
      const marker = new window.google.maps.Marker({
        position: {
          lat: parseFloat(activeIncident.position.lat),
          lng: parseFloat(activeIncident.position.lng),
        },
        map: map,
        title: "Last Known Position",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#FF0000",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 3,
        },
      });

      incidentMarkerRef.current = marker;
      console.log("Incident map initialized successfully");

      // If incident already has zones calculated, redraw them
      if (activeIncident.driftData && activeIncident.leewayCalculated) {
        console.log("Incident has existing zones, redrawing...");
        // Wait for map to be fully ready
        setTimeout(() => {
          if (
            window.google &&
            window.google.maps &&
            window.google.maps.geometry
          ) {
            drawProbabilityZones(activeIncident.driftData);
            console.log("✅ Existing zones redrawn");
          } else {
            console.warn(
              "⚠️ Cannot redraw zones - geometry library not loaded"
            );
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error initializing incident map:", error);
    }
  };

  const handleCreateWaterIncident = async () => {
    if (!validateWaterIncident()) return;

    // Generate unique incident number from database
    const incidentNumber = await generateIncidentNumber();
    const incidentName =
      waterIncidentData.incidentName || `Water Search ${incidentNumber}`;

    // Create incident with water data
    const newIncident = {
      id: Date.now(),
      incidentNumber: incidentNumber,
      name: incidentName,
      fullName: `${incidentName} - ${incidentNumber}`,
      type: "water",
      searchType: waterIncidentData.type,
      position: waterIncidentData.lastKnownPosition,
      data: waterIncidentData,
      createdAt: new Date().toISOString(),
      status: "active",
      leewayCalculated: false,
    };

    // Add to incidents list and set as active
    setIncidents([...incidents, newIncident]);
    setActiveIncident(newIncident);

    // Save to database
    (async () => {
      try {
        const result = await incidentService.createIncident(newIncident);
        if (result.success) {
          console.log("✅ Incident saved to database:", result.incident.id);
          // Update with database ID
          newIncident.id = result.incident.id;
          setIncidents([...incidents, newIncident]);
          setActiveIncident(newIncident);
        } else {
          console.warn(
            "⚠️ Database save failed, incident saved locally only:",
            result.error
          );
        }
      } catch (error) {
        console.error("❌ Database save error:", error);
      }
    })();

    // Initialize leeway factors with incident data
    setLeewayFactors({
      objectType: waterIncidentData.type,
      physicalCharacteristics: waterIncidentData.description,
      timeOfIncident: waterIncidentData.timeOfIncident,
      timeLastConfirmedAlive: waterIncidentData.timeLastConfirmedAlive,
      timeSearchInitiated: waterIncidentData.timeSearchInitiated,
      remainingDaylight: calculateRemainingDaylight(),
      driftAngle: "",
      searchAreaSize: "",
      searchPattern: "expanding-square",
    });

    // Fetch environmental data
    fetchEnvironmentalData(
      parseFloat(waterIncidentData.lastKnownPosition.lat),
      parseFloat(waterIncidentData.lastKnownPosition.lng)
    );

    // Close modal and reset
    setShowNewIncidentModal(false);
    setIncidentStep(2);
    setSearchType("water");
    setWaterIncidentData({
      incidentName: "",
      lastKnownPosition: { lat: "", lng: "" },
      positionSource: "",
      confidenceLevel: "",
      type: "",
      timeOfIncident: "",
      timeLastConfirmedAlive: "",
      timeSearchInitiated: new Date().toTimeString().slice(0, 5),
      victims: [
        {
          id: 1,
          name: "",
          dateOfBirth: "",
          photo: null,
          age: "",
          gender: "",
          weight: "",
          upperClothing: "",
          upperClothingColor: "",
          lowerClothing: "",
          lowerClothingColor: "",
          flotation: "",
          flotationColor: "",
          wetsuit: "",
          reflectiveMaterial: false,
        },
      ],
      physicalDetails: {
        age: "",
        gender: "",
        weight: "",
        clothing: "",
        clothingColor: "",
        flotation: "",
        flotationColor: "",
        wetsuit: "",
        reflectiveMaterial: false,
      },
      medicalState: {
        injuries: "",
        hypothermiaRisk: "",
        fatigue: "",
        intoxication: "",
        medicalConditions: "",
        fitnessStatus: "",
      },
      experienceLevel: "",
      description: "",
    });

    // Switch to incident view
    setCurrentView("incident");
  };

  const calculateRemainingDaylight = () => {
    const now = new Date();
    const sunset = new Date();
    sunset.setHours(18, 30, 0); // Approximate sunset at 6:30 PM

    const diff = sunset - now;
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);

    if (diff < 0) return "No daylight remaining";
    return `${hours}h ${minutes}m`;
  };

  const checkLeewayFactorsComplete = () => {
    return (
      leewayFactors.timeOfIncident &&
      leewayFactors.timeSearchInitiated &&
      environmentalData.surfaceCurrent.status === "success" &&
      environmentalData.wind.status === "success" &&
      googleMapsLoaded
    );
  };

  const handleGenerateProbabilityZones = () => {
    console.log("=== GENERATE ZONES DEBUG ===");
    console.log("Leeway Factors:", leewayFactors);
    console.log("Environmental Data:", environmentalData);
    console.log("Active Incident:", activeIncident);
    console.log("Map Object:", incidentMapObjectRef.current);
    console.log("Google Maps Available:", !!window.google);
    console.log("Geometry Library:", !!window.google?.maps?.geometry);

    if (!checkLeewayFactorsComplete()) {
      alert(
        "Please complete all required leeway factors and ensure environmental data is loaded."
      );
      return;
    }

    // Check if environmental data is actually loaded
    if (
      environmentalData.surfaceCurrent.status !== "success" ||
      environmentalData.wind.status !== "success"
    ) {
      alert(
        "Environmental data is still loading. Please wait a moment and try again."
      );
      console.error("Environmental data not ready:", {
        current: environmentalData.surfaceCurrent.status,
        wind: environmentalData.wind.status,
      });
      return;
    }

    // Check if Google Maps geometry library is loaded
    if (!window.google || !window.google.maps || !window.google.maps.geometry) {
      alert(
        "Map libraries are still loading. Please wait a moment and try again."
      );
      console.error("Google Maps not ready");
      return;
    }

    // Calculate drift based on leeway factors
    console.log("Calculating drift...");
    const drift = calculateDrift();
    console.log("Drift calculated:", drift);

    // Update incident with probability zones
    setActiveIncident((prev) => ({
      ...prev,
      leewayCalculated: true,
      probabilityZones: true,
      driftData: drift,
    }));

    // Draw zones on map
    if (incidentMapObjectRef.current && window.google) {
      console.log("Drawing zones on map...");
      drawProbabilityZones(drift);
    } else {
      console.error("Cannot draw zones - map not available");
    }

    alert(
      `Probability zones generated!\n\n` +
        `• High Probability: ${drift.zones.high.probability}%\n` +
        `• Medium Probability: ${drift.zones.medium.probability}%\n` +
        `• Low Probability: ${drift.zones.low.probability}%\n\n` +
        `Total drift distance: ${drift.totalDrift.toFixed(2)} nm\n` +
        `Drift direction: ${drift.driftDirection.toFixed(0)}°`
    );

    setShowLeewayFactors(false);
  };

  const calculateDrift = () => {
    // Calculate time in water (hours)
    const incidentTime = new Date(`2000-01-01T${leewayFactors.timeOfIncident}`);
    const searchTime = new Date(
      `2000-01-01T${leewayFactors.timeSearchInitiated}`
    );
    const hoursInWater = (searchTime - incidentTime) / (1000 * 60 * 60);

    // Get environmental data
    const currentSpeed = environmentalData.surfaceCurrent.speed; // knots
    const currentDir = environmentalData.surfaceCurrent.direction; // degrees
    const windSpeed = environmentalData.wind.speed; // knots
    const windDir = environmentalData.wind.direction; // degrees

    // Leeway coefficient (3% of wind speed for PIW)
    const leewayFactor = 0.03;
    const leewaySpeed = windSpeed * leewayFactor;

    // Calculate combined drift vector (current + leeway)
    const currentDriftNM = currentSpeed * hoursInWater;
    const leewayDriftNM = leewaySpeed * hoursInWater;

    // Convert to radians for calculation
    const currentDirRad = (currentDir * Math.PI) / 180;
    const windDirRad = (windDir * Math.PI) / 180;

    // Calculate vector components
    const currentX = currentDriftNM * Math.sin(currentDirRad);
    const currentY = currentDriftNM * Math.cos(currentDirRad);
    const leewayX = leewayDriftNM * Math.sin(windDirRad);
    const leewayY = leewayDriftNM * Math.cos(windDirRad);

    // Total drift vector
    const totalX = currentX + leewayX;
    const totalY = currentY + leewayY;
    const totalDrift = Math.sqrt(totalX * totalX + totalY * totalY);
    const driftDirection = (Math.atan2(totalX, totalY) * 180) / Math.PI;

    return {
      totalDrift: totalDrift,
      driftDirection:
        driftDirection >= 0 ? driftDirection : driftDirection + 360,
      hoursInWater: hoursInWater,
      zones: {
        high: { probability: 40, radiusNM: totalDrift * 0.5 },
        medium: { probability: 35, radiusNM: totalDrift * 1.0 },
        low: { probability: 25, radiusNM: totalDrift * 1.5 },
      },
    };
  };

  const drawProbabilityZones = (drift) => {
    const map = incidentMapObjectRef.current;
    if (!map || !window.google || !window.google.maps) {
      console.error("Map or Google Maps not available");
      return;
    }

    // Check if geometry library is loaded
    if (
      !window.google.maps.geometry ||
      !window.google.maps.geometry.spherical
    ) {
      console.error("Google Maps Geometry library not loaded");
      alert(
        "Map libraries are still loading. Please wait a moment and try again."
      );
      return;
    }

    // Clear previous zones
    drawnZonesRef.current.forEach((item) => {
      if (item.setMap) item.setMap(null);
    });
    drawnZonesRef.current = [];

    console.log("Drawing probability zones:", drift);

    // Get LKP coordinates
    const lkp = new window.google.maps.LatLng(
      parseFloat(activeIncident.position.lat),
      parseFloat(activeIncident.position.lng)
    );

    console.log("LKP:", lkp.toString());

    // Calculate drift endpoint (1 nautical mile = 1852 meters)
    const driftEndpoint = window.google.maps.geometry.spherical.computeOffset(
      lkp,
      drift.totalDrift * 1852, // Convert nm to meters
      drift.driftDirection
    );

    console.log("Drift endpoint:", driftEndpoint.toString());
    console.log("Total drift distance:", drift.totalDrift, "nm");
    console.log("Drift direction:", drift.driftDirection, "°");

    // Draw drift line
    const driftLine = new window.google.maps.Polyline({
      path: [lkp, driftEndpoint],
      geodesic: true,
      strokeColor: "#FFFF00",
      strokeOpacity: 1.0,
      strokeWeight: 3,
      map: map,
    });
    drawnZonesRef.current.push(driftLine);
    console.log("Drift line drawn");

    // Draw probability zones as circles
    const zones = [
      {
        radius: drift.zones.high.radiusNM,
        color: "#FF0000",
        opacity: 0.2,
        label: "High (40%)",
      },
      {
        radius: drift.zones.medium.radiusNM,
        color: "#FFA500",
        opacity: 0.15,
        label: "Medium (35%)",
      },
      {
        radius: drift.zones.low.radiusNM,
        color: "#FFFF00",
        opacity: 0.1,
        label: "Low (25%)",
      },
    ];

    zones.forEach((zone, index) => {
      const radiusMeters = zone.radius * 1852;
      console.log(
        `Drawing zone ${index + 1}:`,
        zone.label,
        "radius:",
        zone.radius,
        "nm (",
        radiusMeters,
        "m)"
      );

      const circle = new window.google.maps.Circle({
        strokeColor: zone.color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: zone.color,
        fillOpacity: zone.opacity,
        map: map,
        center: driftEndpoint,
        radius: radiusMeters,
      });
      drawnZonesRef.current.push(circle);
      console.log(`Zone ${index + 1} drawn successfully`);
    });

    // Add marker at drift endpoint
    const driftMarker = new window.google.maps.Marker({
      position: driftEndpoint,
      map: map,
      title: "Estimated Drift Position",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#00FF00",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
      },
    });
    drawnZonesRef.current.push(driftMarker);
    console.log("Drift marker placed");

    // Adjust map bounds to show all zones
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(lkp);
    bounds.extend(driftEndpoint);

    // Extend bounds to include largest zone
    const largestZoneRadius = drift.zones.low.radiusNM * 1852;
    const ne = window.google.maps.geometry.spherical.computeOffset(
      driftEndpoint,
      largestZoneRadius,
      45
    );
    const sw = window.google.maps.geometry.spherical.computeOffset(
      driftEndpoint,
      largestZoneRadius,
      225
    );
    bounds.extend(ne);
    bounds.extend(sw);

    map.fitBounds(bounds);
    console.log("Map bounds adjusted to show all zones");
    console.log("✅ All probability zones drawn successfully");
  };

  // ==================== ENVIRONMENTAL DATA DASHBOARD ====================

  const renderEnvironmentalDashboard = () => {
    if (!activeIncident || currentView !== "incident") return null;

    const getStatusColor = (status) => {
      switch (status) {
        case "success":
          return "#10b981"; // Green
        case "error":
          return "#ef4444"; // Red
        case "loading":
          return "#f59e0b"; // Orange
        default:
          return "#6b7280"; // Gray
      }
    };

    const handleStationChange = (type, stationId) => {
      const station = availableStations[type]?.find((s) => s.id === stationId);
      if (station) {
        setSelectedStation({ ...selectedStation, [type]: station });
        // Refetch data with new station
        fetchEnvironmentalData(
          activeIncident.position.lat,
          activeIncident.position.lng,
          { ...selectedStation, [type]: station }
        );
      }
    };

    return (
      <div className="environmental-dashboard-compact">
        <div className="dashboard-header-compact">
          <h3>🌊 Environmental Data</h3>
          <div className="last-update-compact">
            {environmentalData.lastUpdate ? (
              <span>{environmentalData.lastUpdate.toLocaleTimeString()}</span>
            ) : (
              <span>Loading...</span>
            )}
          </div>
        </div>

        {/* Station Selector Dropdown */}
        {availableStations.tides.length > 0 && (
          <div className="station-selector-container">
            <button
              className="station-selector-toggle"
              onClick={() => setShowStationSelector(!showStationSelector)}
            >
              📍 Data Stations {showStationSelector ? "▲" : "▼"}
            </button>

            {showStationSelector && (
              <div className="station-selector-panel">
                <div className="station-selector-section">
                  <label className="station-selector-label">Tide Station</label>
                  <select
                    className="station-selector-dropdown"
                    onChange={(e) =>
                      handleStationChange("tides", e.target.value)
                    }
                    value={
                      selectedStation?.tides?.id ||
                      availableStations.tides[0]?.id ||
                      ""
                    }
                  >
                    {availableStations.tides.map((station, idx) => (
                      <option key={station.id} value={station.id}>
                        {idx + 1}. {station.name} ({station.distance.toFixed(1)}
                        nm)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="station-selector-section">
                  <label className="station-selector-label">
                    Current Station
                  </label>
                  <select
                    className="station-selector-dropdown"
                    onChange={(e) =>
                      handleStationChange("currents", e.target.value)
                    }
                    value={
                      selectedStation?.currents?.id ||
                      availableStations.currents[0]?.id ||
                      ""
                    }
                  >
                    {availableStations.currents.length > 0 ? (
                      availableStations.currents.map((station, idx) => (
                        <option key={station.id} value={station.id}>
                          {idx + 1}. {station.name} (
                          {station.distance.toFixed(1)}nm)
                        </option>
                      ))
                    ) : (
                      <option value="">No current stations nearby</option>
                    )}
                  </select>
                </div>

                <div className="station-selector-section">
                  <label className="station-selector-label">Buoy Station</label>
                  <select
                    className="station-selector-dropdown"
                    onChange={(e) =>
                      handleStationChange("buoys", e.target.value)
                    }
                    value={
                      selectedStation?.buoys?.id ||
                      availableStations.buoys[0]?.id ||
                      ""
                    }
                  >
                    {availableStations.buoys.length > 0 ? (
                      availableStations.buoys.map((station, idx) => (
                        <option key={station.id} value={station.id}>
                          {idx + 1}. {station.name} (
                          {station.distance.toFixed(1)}nm)
                        </option>
                      ))
                    ) : (
                      <option value="">No buoys nearby</option>
                    )}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="env-data-grid-compact">
          {/* Surface Current */}
          <div
            className="env-data-item-compact"
            style={{
              borderLeft: `3px solid ${getStatusColor(
                environmentalData.surfaceCurrent.status
              )}`,
            }}
          >
            <div className="env-label-compact">Current</div>
            <div className="env-value-compact">
              {environmentalData.surfaceCurrent.status === "success" ? (
                <>
                  {environmentalData.surfaceCurrent.speed.toFixed(1)} kts @{" "}
                  {environmentalData.surfaceCurrent.direction}°
                  {environmentalData.surfaceCurrent.source && (
                    <div className="env-source-compact">
                      ({environmentalData.surfaceCurrent.source})
                    </div>
                  )}
                </>
              ) : (
                <span className="env-loading-compact">Loading...</span>
              )}
            </div>
          </div>

          {/* Wind */}
          <div
            className="env-data-item-compact"
            style={{
              borderLeft: `3px solid ${getStatusColor(
                environmentalData.wind.status
              )}`,
            }}
          >
            <div className="env-label-compact">Wind</div>
            <div className="env-value-compact">
              {environmentalData.wind.status === "success" ? (
                <>
                  {environmentalData.wind.speed.toFixed(1)} kts @{" "}
                  {environmentalData.wind.direction}°
                  {environmentalData.wind.source && (
                    <div className="env-source-compact">
                      ({environmentalData.wind.source})
                    </div>
                  )}
                </>
              ) : (
                <span className="env-loading-compact">Loading...</span>
              )}
            </div>
          </div>

          {/* Tides */}
          <div
            className="env-data-item-compact"
            style={{
              borderLeft: `3px solid ${getStatusColor(
                environmentalData.tides.status
              )}`,
            }}
          >
            <div className="env-label-compact">Tide</div>
            <div className="env-value-compact">
              {environmentalData.tides.status === "success" ? (
                <>
                  {environmentalData.tides.height} ft{" "}
                  {environmentalData.tides.phase}
                  {environmentalData.tides.source && (
                    <div className="env-source-compact">
                      ({environmentalData.tides.source})
                    </div>
                  )}
                </>
              ) : (
                <span className="env-loading-compact">Loading...</span>
              )}
            </div>
          </div>

          {/* Waves */}
          <div
            className="env-data-item-compact"
            style={{
              borderLeft: `3px solid ${getStatusColor(
                environmentalData.waves.status
              )}`,
            }}
          >
            <div className="env-label-compact">Waves</div>
            <div className="env-value-compact">
              {environmentalData.waves.status === "success" ? (
                <>
                  {environmentalData.waves.height} ft /{" "}
                  {environmentalData.waves.period} s
                  {environmentalData.waves.source && (
                    <div className="env-source-compact">
                      ({environmentalData.waves.source})
                    </div>
                  )}
                </>
              ) : (
                <span className="env-loading-compact">Loading...</span>
              )}
            </div>
          </div>

          {/* Water & Air Temperature */}
          <div
            className="env-data-item-compact"
            style={{
              borderLeft: `3px solid ${getStatusColor(
                environmentalData.waterTemp.status
              )}`,
            }}
          >
            <div className="env-label-compact">Water/Air</div>
            <div className="env-value-compact">
              {environmentalData.waterTemp.status === "success" &&
              environmentalData.airTemp.status === "success" ? (
                <>
                  {environmentalData.waterTemp.value}°F /{" "}
                  {environmentalData.airTemp.value}°F
                  {(environmentalData.waterTemp.source ||
                    environmentalData.airTemp.source) && (
                    <div className="env-source-compact">
                      (
                      {environmentalData.waterTemp.source ||
                        environmentalData.airTemp.source}
                      )
                    </div>
                  )}
                </>
              ) : (
                <span className="env-loading-compact">Loading...</span>
              )}
            </div>
          </div>

          {/* Visibility */}
          <div
            className="env-data-item-compact"
            style={{
              borderLeft: `3px solid ${getStatusColor(
                environmentalData.visibility.status
              )}`,
            }}
          >
            <div className="env-label-compact">Visibility</div>
            <div className="env-value-compact">
              {environmentalData.visibility.status === "success" ? (
                <>
                  {environmentalData.visibility.value} nm
                  {environmentalData.visibility.source && (
                    <div className="env-source-compact">
                      ({environmentalData.visibility.source})
                    </div>
                  )}
                </>
              ) : (
                <span className="env-loading-compact">Loading...</span>
              )}
            </div>
          </div>
        </div>

        {/* Forecast */}
        <div
          className="env-forecast-compact"
          style={{
            borderLeft: `3px solid ${getStatusColor(
              environmentalData.forecast.status
            )}`,
          }}
        >
          <div className="env-label-compact">6-12hr Forecast</div>
          <div className="env-forecast-text">
            {environmentalData.forecast.status === "success" ? (
              environmentalData.forecast.summary
            ) : (
              <span className="env-loading-compact">Loading...</span>
            )}
          </div>
        </div>

        {/* Leeway Factors Button */}
        <button
          className="btn-leeway-factors-compact"
          onClick={() => setShowLeewayFactors(true)}
        >
          ⚙️ Update Leeway Factors
        </button>

        {/* Generate Probability Zones Status */}
        {checkLeewayFactorsComplete() && !activeIncident.leewayCalculated ? (
          <button
            className="btn-generate-zones-compact"
            onClick={handleGenerateProbabilityZones}
          >
            {activeIncident.leewayCalculated
              ? "🔄 Regenerate Zones"
              : "🎯 Generate Zones"}
          </button>
        ) : (
          <div className="waiting-status-compact">
            <strong>⚠️ Waiting:</strong>
            {!googleMapsLoaded && <div>• Maps loading...</div>}
            {environmentalData.surfaceCurrent.status !== "success" && (
              <div>• Current data</div>
            )}
            {environmentalData.wind.status !== "success" && (
              <div>• Wind data</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ==================== UNITS PANEL (RIGHT SIDE) ====================

  const renderUnitsPanel = () => {
    if (!activeIncident || currentView !== "incident") return null;

    return (
      <div className="units-panel-compact">
        {/* Assigned Units Section */}
        <div className="units-section">
          <div className="units-header-compact">
            <h3>🚢 Assigned Units</h3>
            <span className="units-count">{assignedUnits.length}</span>
          </div>

          <div className="units-list">
            {assignedUnits.length > 0 ? (
              assignedUnits.map((unit) => (
                <div key={unit.id} className="unit-item-compact">
                  <div className="unit-name">{unit.name}</div>
                  <div className="unit-details">
                    <span className="unit-type">{unit.type}</span>
                    <span className="unit-status searching">{unit.status}</span>
                  </div>
                  <div className="unit-time">{unit.assignedTime}</div>
                </div>
              ))
            ) : (
              <div className="units-empty">No units assigned yet</div>
            )}
          </div>

          <button className="btn-add-unit">➕ Assign Unit</button>
        </div>

        {/* Staging Units Section */}
        <div className="units-section">
          <div className="units-header-compact">
            <h3>⏳ Staging Area</h3>
            <span className="units-count">{stagingUnits.length}</span>
          </div>

          <div className="units-list">
            {stagingUnits.length > 0 ? (
              stagingUnits.map((unit) => (
                <div key={unit.id} className="unit-item-compact">
                  <div className="unit-name">{unit.name}</div>
                  <div className="unit-details">
                    <span className="unit-type">{unit.type}</span>
                    <span className="unit-status staging">{unit.status}</span>
                  </div>
                  <div className="unit-time">ETA: {unit.eta}</div>
                </div>
              ))
            ) : (
              <div className="units-empty">No units in staging</div>
            )}
          </div>

          <button className="btn-add-unit">➕ Add to Staging</button>
        </div>
      </div>
    );
  };

  // ==================== LEEWAY FACTORS MODAL ====================

  const renderLeewayFactorsModal = () => {
    if (!showLeewayFactors) return null;

    return (
      <div
        className="modal-overlay"
        onClick={() => setShowLeewayFactors(false)}
      >
        <div
          className="modal-content modal-large"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Update Leeway Factors & Time Data</h2>
            <button
              className="close-btn"
              onClick={() => setShowLeewayFactors(false)}
            >
              <Icons.Close />
            </button>
          </div>

          <div className="modal-body">
            {/* Auto-filled data */}
            <div className="form-section">
              <h3 className="section-title">Auto-Filled from Incident</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Object Type</label>
                  <input
                    type="text"
                    value={leewayFactors.objectType}
                    disabled
                    className="disabled-input"
                  />
                </div>
                <div className="form-group">
                  <label>Search Initiated</label>
                  <input
                    type="text"
                    value={leewayFactors.timeSearchInitiated}
                    disabled
                    className="disabled-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Physical Characteristics</label>
                <textarea
                  rows="2"
                  value={leewayFactors.physicalCharacteristics}
                  disabled
                  className="disabled-input"
                />
              </div>
            </div>

            {/* Time Factors - Editable for updates */}
            <div
              className="form-section"
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                borderLeft: "4px solid #3b82f6",
              }}
            >
              <h3 className="section-title" style={{ color: "#1e40af" }}>
                ⏰ Time Factors & Location (Editable)
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "#1e40af",
                  marginBottom: "1rem",
                  fontStyle: "italic",
                }}
              >
                Update these fields when new information becomes available.
              </p>

              {/* Last Known Position */}
              <div
                className="form-section"
                style={{
                  background: "white",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 0.75rem 0",
                    color: "#1e40af",
                    fontSize: "0.95rem",
                  }}
                >
                  📍 Last Known Position
                </h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={activeIncident.position.lat}
                      onChange={(e) =>
                        setActiveIncident((prev) => ({
                          ...prev,
                          position: { ...prev.position, lat: e.target.value },
                        }))
                      }
                      placeholder="e.g., 29.760400"
                    />
                  </div>
                  <div className="form-group">
                    <label>Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={activeIncident.position.lng}
                      onChange={(e) =>
                        setActiveIncident((prev) => ({
                          ...prev,
                          position: { ...prev.position, lng: e.target.value },
                        }))
                      }
                      placeholder="e.g., -95.369800"
                    />
                  </div>
                </div>
              </div>

              {/* Time Fields */}
              <div className="form-row">
                <div className="form-group">
                  <label>Time of Incident ✓</label>
                  <input
                    type="time"
                    value={leewayFactors.timeOfIncident || ""}
                    onChange={(e) =>
                      setLeewayFactors((prev) => ({
                        ...prev,
                        timeOfIncident: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Time Last Confirmed Alive</label>
                  <input
                    type="time"
                    value={leewayFactors.timeLastConfirmedAlive || ""}
                    onChange={(e) =>
                      setLeewayFactors((prev) => ({
                        ...prev,
                        timeLastConfirmedAlive: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Time Search Initiated ✓</label>
                  <input
                    type="time"
                    value={leewayFactors.timeSearchInitiated || ""}
                    onChange={(e) =>
                      setLeewayFactors((prev) => ({
                        ...prev,
                        timeSearchInitiated: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Remaining Daylight</label>
                  <input
                    type="text"
                    value={leewayFactors.remainingDaylight}
                    onChange={(e) =>
                      setLeewayFactors((prev) => ({
                        ...prev,
                        remainingDaylight: e.target.value,
                      }))
                    }
                    placeholder="e.g., 3 hours"
                  />
                </div>
              </div>
            </div>

            {/* Additional Factors */}
            <div className="form-section">
              <h3 className="section-title">Additional Drift Factors</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Drift Angle (degrees)</label>
                  <input
                    type="number"
                    placeholder="e.g., 15"
                    value={leewayFactors.driftAngle}
                    onChange={(e) =>
                      setLeewayFactors({
                        ...leewayFactors,
                        driftAngle: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Search Area Size (nm²)</label>
                  <input
                    type="number"
                    placeholder="Auto-calculated"
                    value={leewayFactors.searchAreaSize}
                    onChange={(e) =>
                      setLeewayFactors({
                        ...leewayFactors,
                        searchAreaSize: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Search Pattern</label>
                <select
                  value={leewayFactors.searchPattern}
                  onChange={(e) =>
                    setLeewayFactors({
                      ...leewayFactors,
                      searchPattern: e.target.value,
                    })
                  }
                >
                  <option value="expanding-square">Expanding Square</option>
                  <option value="sector">Sector Search</option>
                  <option value="parallel">Parallel Track</option>
                  <option value="creeping-line">Creeping Line</option>
                </select>
              </div>
            </div>

            {/* Environmental Data Summary */}
            <div className="form-section">
              <h3 className="section-title">
                Current Environmental Conditions
              </h3>
              <div className="env-summary">
                <div className="env-summary-item">
                  <strong>Surface Current:</strong>{" "}
                  {environmentalData.surfaceCurrent.status === "success"
                    ? `${environmentalData.surfaceCurrent.speed.toFixed(
                        1
                      )} kts @ ${environmentalData.surfaceCurrent.direction}°`
                    : "Not available"}
                </div>
                <div className="env-summary-item">
                  <strong>Wind:</strong>{" "}
                  {environmentalData.wind.status === "success"
                    ? `${environmentalData.wind.speed.toFixed(1)} kts @ ${
                        environmentalData.wind.direction
                      }°`
                    : "Not available"}
                </div>
                <div className="env-summary-item">
                  <strong>Water Temp:</strong>{" "}
                  {environmentalData.waterTemp.status === "success"
                    ? `${environmentalData.waterTemp.value}°F`
                    : "Not available"}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn-secondary-modal"
              onClick={() => setShowLeewayFactors(false)}
            >
              Cancel
            </button>
            <button
              className="btn-primary-modal"
              onClick={() => {
                if (!leewayFactors.timeOfIncident) {
                  alert("Please enter the time of incident");
                  return;
                }

                // Automatically regenerate probability zones if conditions are met
                if (
                  checkLeewayFactorsComplete() &&
                  environmentalData.surfaceCurrent.status === "success" &&
                  environmentalData.wind.status === "success" &&
                  window.google?.maps?.geometry
                ) {
                  console.log(
                    "Auto-regenerating probability zones after leeway update..."
                  );
                  const drift = calculateDrift();

                  // Update incident with new zones
                  setActiveIncident((prev) => ({
                    ...prev,
                    leewayCalculated: true,
                    probabilityZones: true,
                    driftData: drift,
                  }));

                  // Redraw zones on map
                  if (incidentMapObjectRef.current) {
                    drawProbabilityZones(drift);
                  }
                }

                setShowLeewayFactors(false);
              }}
            >
              Save Leeway Factors
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      setIsLoggedIn(false);
      // Reset user data
      setUserData({
        firstName: "",
        lastName: "",
        fullName: "",
        department: "",
        departmentLogo: null,
        rank: "",
        email: "",
        password: "",
        phone: "",
        profilePicture: null,
        notifications: {
          email: true,
          sms: true,
          push: true,
          incidents: true,
          teamUpdates: true,
        },
      });
    }
  };

  const handleCreateIncident = () => {
    // Check active incident limit BEFORE opening modal
    const activeIncidentsCount = incidents.filter(
      (inc) => inc.status === "active"
    ).length;
    if (activeIncidentsCount >= 5) {
      alert(
        '⚠️ Active Incident Limit Reached\n\nYou currently have 5 active incidents open, which is the maximum allowed.\n\nPlease end one or more active incidents before creating a new one.\n\nYou can end an incident by clicking the "End Incident" button on the incident page.'
      );
      return;
    }

    setShowNewIncidentModal(true);
    setSearchType("water");
    setIncidentStep(2);
  };

  const handleJoinIncident = () => {
    alert("Join Active Incident feature coming soon!");
  };

  const handlePreviousIncidents = () => {
    setShowPreviousIncidents(true);
  };

  const handleTeamManagement = () => {
    setShowTeamManagement(true);
  };

  const handleResources = () => {
    setShowResources(true);
  };

  const handleCommunications = () => {
    setShowCommunications(true);
  };

  const handleReports = () => {
    setShowReports(true);
  };

  const handleTraining = () => {
    setShowTraining(true);
  };

  // Team Management handlers
  const handleSendInvitation = async () => {
    if (!invitationForm.firstName || !invitationForm.email) {
      alert("Please fill in at least First Name and Email");
      return;
    }

    const result = await authService.createUserInvitation(invitationForm);

    if (result.success) {
      alert(
        `Invitation sent to ${invitationForm.email}!\n\nInvitation Link:\n${result.invitationLink}\n\nShare this link with the new team member.`
      );
      setInvitationForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "end_user",
      });
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleRemoveTeamMember = (memberId) => {
    if (confirm("Are you sure you want to remove this team member?")) {
      setTeamMembers(teamMembers.filter((m) => m.id !== memberId));
    }
  };

  // Resources handlers
  const handleAddResource = () => {
    const name = prompt("Enter resource name:");
    if (name) {
      const newResource = {
        id: resources.length + 1,
        name: name,
        type: "Equipment",
        status: "available",
        location: "Command Center",
      };
      setResources([...resources, newResource]);
    }
  };

  const handleRemoveResource = (resourceId) => {
    if (confirm("Are you sure you want to remove this resource?")) {
      setResources(resources.filter((r) => r.id !== resourceId));
    }
  };

  // Communications handlers
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        sender: userData.fullName || "You",
        text: newMessage,
        timestamp: new Date(),
      };
      setMessages([...messages, message]);
      setNewMessage("");
    }
  };

  const handleViewIncidentDetails = (incident) => {
    alert(
      `Viewing details for:\n${incident.name}\nType: ${incident.type}\nDate: ${incident.date}\nDuration: ${incident.duration}\nStatus: ${incident.status}`
    );
  };

  // Settings handlers
  const handleNotificationToggle = (key) => {
    setUserData({
      ...userData,
      notifications: {
        ...userData.notifications,
        [key]: !userData.notifications[key],
      },
    });
  };

  const handleSaveSettings = async () => {
    alert("Settings saved successfully!");
    setShowSettings(false);
  };

  // ==================== RENDER MODALS ====================

  // ==================== NEW INCIDENT MODAL ====================

  // New incident form state
  const [incidentStep, setIncidentStep] = useState(1); // 1 = type selection, 2 = form
  const [waterIncidentData, setWaterIncidentData] = useState({
    incidentName: "",
    lastKnownPosition: { lat: "", lng: "" },
    positionSource: "",
    confidenceLevel: "",
    type: "",
    // Time tracking fields
    timeOfIncident: "",
    timeLastConfirmedAlive: "",
    timeSearchInitiated: new Date().toTimeString().slice(0, 5), // Auto-filled with current time (HH:MM)
    victims: [
      {
        id: 1,
        name: "",
        dateOfBirth: "",
        photo: null,
        age: "",
        gender: "",
        weight: "",
        upperClothing: "",
        upperClothingColor: "",
        lowerClothing: "",
        lowerClothingColor: "",
        flotation: "",
        flotationColor: "",
        wetsuit: "",
        reflectiveMaterial: false,
      },
    ],
    // Keeping old physicalDetails for backward compatibility during transition
    physicalDetails: {
      age: "",
      gender: "",
      weight: "",
      clothing: "",
      clothingColor: "",
      flotation: "",
      flotationColor: "",
      wetsuit: "",
      reflectiveMaterial: false,
    },
    medicalState: {
      injuries: "",
      hypothermiaRisk: "",
      fatigue: "",
      intoxication: "",
      medicalConditions: "",
      fitnessStatus: "",
    },
    experienceLevel: "",
    description: "",
  });

  // Auto-generate description based on form data
  const generateWaterDescription = () => {
    const data = waterIncidentData;
    const ms = data.medicalState;

    let desc = "";

    // Multiple victims description
    if (data.victims && data.victims.length > 0) {
      if (data.victims.length === 1) {
        // Single victim
        const v = data.victims[0];

        // Name if provided
        if (v.name) desc += `${v.name}, `;

        // Age and gender
        if (v.age) desc += `${v.age} year old `;
        if (v.gender) desc += `${v.gender.toLowerCase()}, `;

        // Weight
        if (v.weight) desc += `approximately ${v.weight}lbs, `;

        // Medical/Intoxication
        if (ms.intoxication && ms.intoxication.toLowerCase() !== "none") {
          desc += `${ms.intoxication.toLowerCase()}, `;
        }

        // Type of incident
        if (data.type) desc += `${data.type.toLowerCase()} `;

        // Location
        if (data.lastKnownPosition.lat && data.lastKnownPosition.lng) {
          desc += `at coordinates ${data.lastKnownPosition.lat}, ${data.lastKnownPosition.lng}`;
          if (data.positionSource) {
            desc += `, ${data.positionSource.toLowerCase()}`;
          }
          desc += ". ";
        }

        // Physical description with new clothing structure
        desc += "Wearing ";
        if (v.upperClothing) {
          desc += `${
            v.upperClothingColor ? v.upperClothingColor.toLowerCase() + " " : ""
          }${v.upperClothing.toLowerCase()}`;
        }
        if (v.upperClothing && v.lowerClothing) desc += " and ";
        if (v.lowerClothing) {
          desc += `${
            v.lowerClothingColor ? v.lowerClothingColor.toLowerCase() + " " : ""
          }${v.lowerClothing.toLowerCase()}`;
        }
        desc += ". ";

        // Flotation
        if (v.flotation && v.flotation.toLowerCase() !== "none") {
          desc += `Has ${
            v.flotationColor ? v.flotationColor.toLowerCase() + " " : ""
          }${v.flotation.toLowerCase()}. `;
        } else {
          desc += "No life jacket. ";
        }

        // Experience
        if (data.experienceLevel) {
          desc += `${
            data.experienceLevel.charAt(0).toUpperCase() +
            data.experienceLevel.slice(1)
          }. `;
        }

        // Medical conditions
        if (
          ms.medicalConditions &&
          ms.medicalConditions.toLowerCase() !== "none"
        ) {
          desc += `Medical: ${ms.medicalConditions.toLowerCase()}. `;
        }

        // Fitness
        if (ms.fitnessStatus) {
          desc += `Fitness: ${ms.fitnessStatus.toLowerCase()}.`;
        }
      } else {
        // Multiple victims
        desc += `${data.type || "Incident"} involving ${
          data.victims.length
        } victims `;
        if (data.lastKnownPosition.lat && data.lastKnownPosition.lng) {
          desc += `at coordinates ${data.lastKnownPosition.lat}, ${data.lastKnownPosition.lng}. `;
        }

        data.victims.forEach((v, index) => {
          desc += `\n\nVictim #${v.id}: `;
          if (v.name) desc += `${v.name}, `;
          if (v.age) desc += `${v.age} year old `;
          if (v.gender) desc += `${v.gender.toLowerCase()}, `;
          if (v.weight) desc += `${v.weight}lbs. `;

          desc += "Wearing ";
          if (v.upperClothing) {
            desc += `${
              v.upperClothingColor
                ? v.upperClothingColor.toLowerCase() + " "
                : ""
            }${v.upperClothing.toLowerCase()}`;
          }
          if (v.upperClothing && v.lowerClothing) desc += " and ";
          if (v.lowerClothing) {
            desc += `${
              v.lowerClothingColor
                ? v.lowerClothingColor.toLowerCase() + " "
                : ""
            }${v.lowerClothing.toLowerCase()}`;
          }
          desc += ". ";

          if (v.flotation && v.flotation.toLowerCase() !== "none") {
            desc += `Has ${
              v.flotationColor ? v.flotationColor.toLowerCase() + " " : ""
            }${v.flotation.toLowerCase()}. `;
          }
        });

        // Experience and medical for all
        if (data.experienceLevel) {
          desc += `\n\nExperience: ${data.experienceLevel}. `;
        }
        if (ms.medicalConditions) {
          desc += `Medical notes: ${ms.medicalConditions}. `;
        }
      }
    }

    return desc.trim();
  };

  // Update description whenever form data changes
  useEffect(() => {
    if (incidentStep === 2 && searchType === "water") {
      const autoDesc = generateWaterDescription();
      setWaterIncidentData((prev) => ({
        ...prev,
        description: autoDesc,
      }));
    }
  }, [
    waterIncidentData.victims,
    waterIncidentData.medicalState,
    waterIncidentData.type,
    waterIncidentData.lastKnownPosition,
    waterIncidentData.positionSource,
    waterIncidentData.experienceLevel,
  ]);

  const handleWaterIncidentChange = (field, value) => {
    setWaterIncidentData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Victim management functions
  const handleAddVictim = () => {
    const newVictim = {
      id: waterIncidentData.victims.length + 1,
      name: "",
      dateOfBirth: "",
      photo: null,
      age: "",
      gender: "",
      weight: "",
      upperClothing: "",
      upperClothingColor: "",
      lowerClothing: "",
      lowerClothingColor: "",
      flotation: "",
      flotationColor: "",
      wetsuit: "",
      reflectiveMaterial: false,
    };
    setWaterIncidentData((prev) => ({
      ...prev,
      victims: [...prev.victims, newVictim],
    }));
  };

  const handleRemoveVictim = (victimId) => {
    if (waterIncidentData.victims.length === 1) {
      alert("At least one victim is required");
      return;
    }
    setWaterIncidentData((prev) => ({
      ...prev,
      victims: prev.victims.filter((v) => v.id !== victimId),
    }));
  };

  const handleVictimChange = (victimId, field, value) => {
    setWaterIncidentData((prev) => ({
      ...prev,
      victims: prev.victims.map((v) =>
        v.id === victimId ? { ...v, [field]: value } : v
      ),
    }));
  };

  const handleVictimPhotoUpload = (victimId, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleVictimChange(victimId, "photo", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhysicalDetailsChange = (field, value) => {
    setWaterIncidentData((prev) => ({
      ...prev,
      physicalDetails: {
        ...prev.physicalDetails,
        [field]: value,
      },
    }));
  };

  const handleMedicalStateChange = (field, value) => {
    setWaterIncidentData((prev) => ({
      ...prev,
      medicalState: {
        ...prev.medicalState,
        [field]: value,
      },
    }));
  };

  const validateWaterIncident = () => {
    // Required fields validation
    if (
      !waterIncidentData.lastKnownPosition.lat ||
      !waterIncidentData.lastKnownPosition.lng
    ) {
      alert("Last known position is required");
      return false;
    }
    if (!waterIncidentData.type) {
      alert("Type is required");
      return false;
    }

    // Time tracking validation
    if (!waterIncidentData.timeOfIncident) {
      alert("Time of Incident is required");
      return false;
    }
    if (!waterIncidentData.timeSearchInitiated) {
      alert("Time Search Initiated is required");
      return false;
    }

    // Validate victims for PIW, kayak, swimmer, diver
    const requiresPhysical = [
      "Person in Water (PIW)",
      "Kayak",
      "Swimmer",
      "Diver",
    ];
    if (requiresPhysical.includes(waterIncidentData.type)) {
      for (let victim of waterIncidentData.victims) {
        if (
          !victim.age ||
          !victim.gender ||
          !victim.weight ||
          !victim.upperClothing ||
          !victim.upperClothingColor ||
          !victim.lowerClothing ||
          !victim.lowerClothingColor
        ) {
          alert(
            `Victim #${victim.id}: Age, gender, weight, and clothing details (upper and lower with colors) are required`
          );
          return false;
        }
      }
    }

    // Medical state required for PIW
    if (waterIncidentData.type === "Person in Water (PIW)") {
      const ms = waterIncidentData.medicalState;
      if (!ms.hypothermiaRisk || !ms.fatigue || !ms.fitnessStatus) {
        alert(
          "Medical state information (hypothermia risk, fatigue, fitness status) is required for PIW"
        );
        return false;
      }
    }

    return true;
  };

  const renderNewIncidentModal = () => {
    if (!showNewIncidentModal) return null;

    return (
      <div
        className="modal-overlay"
        onClick={() => {
          setShowNewIncidentModal(false);
          setIncidentStep(2);
          setSearchType("water");
        }}
      >
        <div
          className="modal-content modal-large incident-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>New Water Search Incident</h2>
            <button
              className="close-btn"
              onClick={() => {
                setShowNewIncidentModal(false);
                setIncidentStep(2);
                setSearchType("water");
              }}
            >
              <Icons.Close />
            </button>
          </div>

          <div className="modal-body">
            {/* STEP 2: Water Incident Form */}
            <div className="incident-form-container">
              {/* Incident Name */}
              <div className="form-section">
                <div className="form-group">
                  <label>
                    Incident Name <span className="optional">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter incident name or leave blank for auto-generation"
                    value={waterIncidentData.incidentName}
                    onChange={(e) =>
                      handleWaterIncidentChange("incidentName", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Last Known Position */}
              <div className="form-section">
                <h3 className="section-title required-section">
                  Last Known Position
                </h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Latitude <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 29.7604"
                      value={waterIncidentData.lastKnownPosition.lat}
                      onChange={(e) =>
                        handleWaterIncidentChange("lastKnownPosition", {
                          ...waterIncidentData.lastKnownPosition,
                          lat: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Longitude <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., -95.3698"
                      value={waterIncidentData.lastKnownPosition.lng}
                      onChange={(e) =>
                        handleWaterIncidentChange("lastKnownPosition", {
                          ...waterIncidentData.lastKnownPosition,
                          lng: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <button
                  className="btn-secondary-modal"
                  style={{ marginTop: "0.5rem" }}
                  onClick={(e) => {
                    e.preventDefault();
                    // Set initial position for map picker
                    const currentLat =
                      waterIncidentData.lastKnownPosition.lat || 29.7604;
                    const currentLng =
                      waterIncidentData.lastKnownPosition.lng || -95.3698;
                    setMapPickerPosition({
                      lat: parseFloat(currentLat) || 29.7604,
                      lng: parseFloat(currentLng) || -95.3698,
                    });
                    setShowMapPicker(true);
                  }}
                >
                  📍 Choose on Map
                </button>
              </div>

              {/* Position Source & Confidence */}
              <div className="form-section">
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Source of Position{" "}
                      <span className="optional">(Optional)</span>
                    </label>
                    <select
                      value={waterIncidentData.positionSource}
                      onChange={(e) =>
                        handleWaterIncidentChange(
                          "positionSource",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Select source...</option>
                      <option value="Eyewitness">Eyewitness</option>
                      <option value="AIS">AIS</option>
                      <option value="Phone Ping">Phone Ping</option>
                      <option value="Vessel Last Transmission">
                        Vessel Last Transmission
                      </option>
                      <option value="Radar Track">Radar Track</option>
                      <option value="Camera Footage">Camera Footage</option>
                      <option value="GPS Device">GPS Device</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>
                      Confidence Level{" "}
                      <span className="optional">(Optional)</span>
                    </label>
                    <select
                      value={waterIncidentData.confidenceLevel}
                      onChange={(e) =>
                        handleWaterIncidentChange(
                          "confidenceLevel",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Select level...</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Type */}
              <div className="form-section">
                <div className="form-group">
                  <label>
                    Type <span className="required">*</span>
                  </label>
                  <select
                    value={waterIncidentData.type}
                    onChange={(e) =>
                      handleWaterIncidentChange("type", e.target.value)
                    }
                    required
                  >
                    <option value="">Select type...</option>
                    <option value="Person in Water (PIW)">
                      Person in Water (PIW)
                    </option>
                    <option value="Kayak">Kayak</option>
                    <option value="Vessel">Vessel</option>
                    <option value="Swimmer">Swimmer</option>
                    <option value="Diver">Diver</option>
                    <option value="Overturned Boat">Overturned Boat</option>
                    <option value="Debris Field">Debris Field</option>
                    <option value="Raft">Raft</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Time Tracking - Required Information */}
              <div className="form-section highlighted-section">
                <h3 className="section-title required-section">
                  Time Tracking
                </h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Time of Incident <span className="required">*</span>
                    </label>
                    <input
                      type="time"
                      value={waterIncidentData.timeOfIncident}
                      onChange={(e) =>
                        handleWaterIncidentChange(
                          "timeOfIncident",
                          e.target.value
                        )
                      }
                      required
                    />
                    <small
                      style={{
                        display: "block",
                        marginTop: "4px",
                        color: "#666",
                        fontSize: "12px",
                      }}
                    >
                      When did the incident occur?
                    </small>
                  </div>
                  <div className="form-group">
                    <label>
                      Time Last Confirmed Alive{" "}
                      <span className="optional">(Optional)</span>
                    </label>
                    <input
                      type="time"
                      value={waterIncidentData.timeLastConfirmedAlive}
                      onChange={(e) =>
                        handleWaterIncidentChange(
                          "timeLastConfirmedAlive",
                          e.target.value
                        )
                      }
                    />
                    <small
                      style={{
                        display: "block",
                        marginTop: "4px",
                        color: "#666",
                        fontSize: "12px",
                      }}
                    >
                      Last contact or sighting
                    </small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Time Search Initiated <span className="required">*</span>
                    </label>
                    <input
                      type="time"
                      value={waterIncidentData.timeSearchInitiated}
                      onChange={(e) =>
                        handleWaterIncidentChange(
                          "timeSearchInitiated",
                          e.target.value
                        )
                      }
                      required
                    />
                    <small
                      style={{
                        display: "block",
                        marginTop: "4px",
                        color: "#666",
                        fontSize: "12px",
                      }}
                    >
                      Auto-filled. Update to first unit on scene time if known.
                    </small>
                  </div>
                  <div className="form-group">
                    <label style={{ visibility: "hidden" }}>Spacer</label>
                    <div
                      style={{
                        padding: "10px",
                        background: "rgba(59, 130, 246, 0.1)",
                        borderRadius: "4px",
                        fontSize: "13px",
                      }}
                    >
                      <strong>Elapsed Time:</strong>{" "}
                      {waterIncidentData.timeOfIncident &&
                      waterIncidentData.timeSearchInitiated
                        ? (() => {
                            const [incHour, incMin] =
                              waterIncidentData.timeOfIncident
                                .split(":")
                                .map(Number);
                            const [searchHour, searchMin] =
                              waterIncidentData.timeSearchInitiated
                                .split(":")
                                .map(Number);
                            const incMinutes = incHour * 60 + incMin;
                            const searchMinutes = searchHour * 60 + searchMin;
                            let diff = searchMinutes - incMinutes;
                            if (diff < 0) diff += 24 * 60; // Handle day rollover
                            const hours = Math.floor(diff / 60);
                            const mins = diff % 60;
                            return `${hours}h ${mins}m`;
                          })()
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Details - Required for PIW, Kayak, Swimmer, Diver */}
              {["Person in Water (PIW)", "Kayak", "Swimmer", "Diver"].includes(
                waterIncidentData.type
              ) && (
                <div className="form-section highlighted-section">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <h3 className="section-title required-section">
                      Physical Details
                    </h3>
                    <button
                      type="button"
                      className="btn-secondary-modal"
                      onClick={handleAddVictim}
                      style={{ fontSize: "14px", padding: "8px 16px" }}
                    >
                      ➕ Add Additional Victim
                    </button>
                  </div>

                  {waterIncidentData.victims.map((victim, index) => (
                    <div
                      key={victim.id}
                      style={{
                        border: "2px solid #3b82f6",
                        borderRadius: "8px",
                        padding: "1.5rem",
                        marginBottom: "1.5rem",
                        background: "rgba(59, 130, 246, 0.03)",
                      }}
                    >
                      {/* Victim Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "1rem",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            color: "#3b82f6",
                            fontSize: "18px",
                            fontWeight: "600",
                          }}
                        >
                          Victim #{victim.id}
                        </h4>
                        {waterIncidentData.victims.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVictim(victim.id)}
                            style={{
                              background: "#ef4444",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              padding: "6px 12px",
                              cursor: "pointer",
                              fontSize: "13px",
                            }}
                          >
                            ✕ Remove
                          </button>
                        )}
                      </div>

                      {/* Optional: Name, DOB, Photo */}
                      <div className="form-row">
                        <div className="form-group">
                          <label>
                            Name <span className="optional">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Enter victim's name"
                            value={victim.name}
                            onChange={(e) =>
                              handleVictimChange(
                                victim.id,
                                "name",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>
                            Date of Birth{" "}
                            <span className="optional">(Optional)</span>
                          </label>
                          <input
                            type="date"
                            value={victim.dateOfBirth}
                            onChange={(e) =>
                              handleVictimChange(
                                victim.id,
                                "dateOfBirth",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>
                            Photo <span className="optional">(Optional)</span>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleVictimPhotoUpload(victim.id, e)
                            }
                            style={{ padding: "8px" }}
                          />
                          {victim.photo && (
                            <div style={{ marginTop: "8px" }}>
                              <img
                                src={victim.photo}
                                alt={`Victim ${victim.id}`}
                                style={{
                                  maxWidth: "100px",
                                  maxHeight: "100px",
                                  objectFit: "cover",
                                  borderRadius: "4px",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Age, Gender, Weight */}
                      <div className="form-row">
                        <div className="form-group">
                          <label>
                            Age <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., 25 or 'Young adult'"
                            value={victim.age}
                            onChange={(e) =>
                              handleVictimChange(
                                victim.id,
                                "age",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>
                            Gender <span className="required">*</span>
                          </label>
                          <select
                            value={victim.gender}
                            onChange={(e) =>
                              handleVictimChange(
                                victim.id,
                                "gender",
                                e.target.value
                              )
                            }
                            required
                          >
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Unknown">Unknown</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>
                            Weight (lbs) <span className="required">*</span>
                          </label>
                          <input
                            type="number"
                            placeholder="e.g., 200"
                            value={victim.weight}
                            onChange={(e) =>
                              handleVictimChange(
                                victim.id,
                                "weight",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>
                      </div>

                      {/* Upper Clothing with Color */}
                      <div className="form-row">
                        <div className="form-group">
                          <label>
                            Upper Body Clothing{" "}
                            <span className="required">*</span>
                          </label>
                          <select
                            value={victim.upperClothing}
                            onChange={(e) =>
                              handleVictimChange(
                                victim.id,
                                "upperClothing",
                                e.target.value
                              )
                            }
                            required
                          >
                            <option value="">Select...</option>
                            <option value="Short Sleeve Shirt">
                              Short Sleeve Shirt
                            </option>
                            <option value="Long Sleeve Shirt">
                              Long Sleeve Shirt
                            </option>
                            <option value="T-Shirt">T-Shirt</option>
                            <option value="Tank Top">Tank Top</option>
                            <option value="Jacket">Jacket</option>
                            <option value="Hoodie">Hoodie</option>
                            <option value="Windbreaker">Windbreaker</option>
                            <option value="Sweater">Sweater</option>
                            <option value="No Shirt">No Shirt</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>
                            Upper Clothing Color{" "}
                            <span className="required">*</span>
                          </label>
                          <select
                            value={victim.upperClothingColor}
                            onChange={(e) =>
                              handleVictimChange(
                                victim.id,
                                "upperClothingColor",
                                e.target.value
                              )
                            }
                            required
                          >
                            <option value="">Select color...</option>
                            <option value="White">White</option>
                            <option value="Black">Black</option>
                            <option value="Gray">Gray</option>
                            <option value="Red">Red</option>
                            <option value="Blue">Blue</option>
                            <option value="Navy">Navy</option>
                            <option value="Green">Green</option>
                            <option value="Yellow">Yellow</option>
                            <option value="Orange">Orange</option>
                            <option value="Pink">Pink</option>
                            <option value="Purple">Purple</option>
                            <option value="Brown">Brown</option>
                            <option value="Tan">Tan</option>
                            <option value="Multicolor">Multicolor</option>
                          </select>
                        </div>
                      </div>

                      {/* Lower Clothing with Color */}
                      <div className="form-row">
                        <div className="form-group">
                          <label>
                            Lower Body Clothing{" "}
                            <span className="required">*</span>
                          </label>
                          <select
                            value={victim.lowerClothing}
                            onChange={(e) =>
                              handleVictimChange(
                                victim.id,
                                "lowerClothing",
                                e.target.value
                              )
                            }
                            required
                          >
                            <option value="">Select...</option>
                            <option value="Pants">Pants</option>
                            <option value="Jeans">Jeans</option>
                            <option value="Shorts">Shorts</option>
                            <option value="Swim Trunks">Swim Trunks</option>
                            <option value="Swim Suit">Swim Suit</option>
                            <option value="Board Shorts">Board Shorts</option>
                            <option value="Athletic Shorts">
                              Athletic Shorts
                            </option>
                            <option value="Skirt">Skirt</option>
                            <option value="No Bottoms">No Bottoms</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>
                            Lower Clothing Color{" "}
                            <span className="required">*</span>
                          </label>
                          <select
                            value={victim.lowerClothingColor}
                            onChange={(e) =>
                              handleVictimChange(
                                victim.id,
                                "lowerClothingColor",
                                e.target.value
                              )
                            }
                            required
                          >
                            <option value="">Select color...</option>
                            <option value="White">White</option>
                            <option value="Black">Black</option>
                            <option value="Gray">Gray</option>
                            <option value="Red">Red</option>
                            <option value="Blue">Blue</option>
                            <option value="Navy">Navy</option>
                            <option value="Green">Green</option>
                            <option value="Yellow">Yellow</option>
                            <option value="Orange">Orange</option>
                            <option value="Pink">Pink</option>
                            <option value="Purple">Purple</option>
                            <option value="Brown">Brown</option>
                            <option value="Tan">Tan</option>
                            <option value="Denim">Denim</option>
                            <option value="Khaki">Khaki</option>
                            <option value="Multicolor">Multicolor</option>
                          </select>
                        </div>
                      </div>

                      {/* Flotation and Color */}
                      <div className="form-row">
                        <div className="form-group">
                          <label>Flotation/Life Jacket</label>
                          <select
                            value={victim.flotation}
                            onChange={(e) =>
                              handleVictimChange(
                                victim.id,
                                "flotation",
                                e.target.value
                              )
                            }
                          >
                            <option value="">Select...</option>
                            <option value="Type I PFD">Type I PFD</option>
                            <option value="Type II PFD">Type II PFD</option>
                            <option value="Type III PFD">Type III PFD</option>
                            <option value="Type IV PFD">Type IV PFD</option>
                            <option value="Type V PFD">Type V PFD</option>
                            <option value="Inflatable PFD">
                              Inflatable PFD
                            </option>
                            <option value="None">None</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Flotation Color</label>
                          <select
                            value={victim.flotationColor}
                            onChange={(e) =>
                              handleVictimChange(
                                victim.id,
                                "flotationColor",
                                e.target.value
                              )
                            }
                          >
                            <option value="">Select color...</option>
                            <option value="Orange">Orange</option>
                            <option value="Yellow">Yellow</option>
                            <option value="Red">Red</option>
                            <option value="Blue">Blue</option>
                            <option value="Green">Green</option>
                            <option value="Pink">Pink</option>
                            <option value="Black">Black</option>
                            <option value="White">White</option>
                            <option value="Camo">Camo</option>
                          </select>
                        </div>
                      </div>

                      {/* Wetsuit and Reflective Material */}
                      <div className="form-row">
                        <div className="form-group">
                          <label>Wetsuit/Drysuit</label>
                          <select
                            value={victim.wetsuit}
                            onChange={(e) =>
                              handleVictimChange(
                                victim.id,
                                "wetsuit",
                                e.target.value
                              )
                            }
                          >
                            <option value="">Select...</option>
                            <option value="Full Wetsuit">Full Wetsuit</option>
                            <option value="Shorty Wetsuit">
                              Shorty Wetsuit
                            </option>
                            <option value="Spring Suit">Spring Suit</option>
                            <option value="Drysuit">Drysuit</option>
                            <option value="None">None</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={victim.reflectiveMaterial}
                              onChange={(e) =>
                                handleVictimChange(
                                  victim.id,
                                  "reflectiveMaterial",
                                  e.target.checked
                                )
                              }
                            />
                            <span>Reflective Material Present</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Experience Level */}
              <div className="form-section">
                <div className="form-group">
                  <label>
                    Experience Level{" "}
                    <span className="optional">(Optional)</span>
                  </label>
                  <select
                    value={waterIncidentData.experienceLevel}
                    onChange={(e) =>
                      handleWaterIncidentChange(
                        "experienceLevel",
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select experience...</option>
                    <option value="Expert swimmer">Expert swimmer</option>
                    <option value="Strong swimmer">Strong swimmer</option>
                    <option value="Average swimmer">Average swimmer</option>
                    <option value="Weak swimmer">Weak swimmer</option>
                    <option value="Non-swimmer">Non-swimmer</option>
                    <option value="Experienced boater">
                      Experienced boater
                    </option>
                    <option value="Novice boater">Novice boater</option>
                    <option value="Certified diver">Certified diver</option>
                  </select>
                </div>
              </div>

              {/* Medical State - Required for PIW - MOVED TO END */}
              {waterIncidentData.type === "Person in Water (PIW)" && (
                <div className="form-section highlighted-section">
                  <h3 className="section-title required-section">
                    Medical State
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Injuries</label>
                      <input
                        type="text"
                        placeholder="Describe any known injuries"
                        value={waterIncidentData.medicalState.injuries}
                        onChange={(e) =>
                          handleMedicalStateChange("injuries", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        Hypothermia Risk <span className="required">*</span>
                      </label>
                      <select
                        value={waterIncidentData.medicalState.hypothermiaRisk}
                        onChange={(e) =>
                          handleMedicalStateChange(
                            "hypothermiaRisk",
                            e.target.value
                          )
                        }
                        required
                      >
                        <option value="">Select...</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        Fatigue <span className="required">*</span>
                      </label>
                      <select
                        value={waterIncidentData.medicalState.fatigue}
                        onChange={(e) =>
                          handleMedicalStateChange("fatigue", e.target.value)
                        }
                        required
                      >
                        <option value="">Select...</option>
                        <option value="Exhausted">Exhausted</option>
                        <option value="Fatigued">Fatigued</option>
                        <option value="Normal">Normal</option>
                        <option value="Alert">Alert</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Intoxication</label>
                      <select
                        value={waterIncidentData.medicalState.intoxication}
                        onChange={(e) =>
                          handleMedicalStateChange(
                            "intoxication",
                            e.target.value
                          )
                        }
                      >
                        <option value="">Select...</option>
                        <option value="Intoxicated">Intoxicated</option>
                        <option value="Impaired">Impaired</option>
                        <option value="Sober">Sober</option>
                        <option value="Unknown">Unknown</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Medical Conditions</label>
                      <input
                        type="text"
                        placeholder="e.g., Diabetes, Heart condition, None"
                        value={waterIncidentData.medicalState.medicalConditions}
                        onChange={(e) =>
                          handleMedicalStateChange(
                            "medicalConditions",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        Fitness Status <span className="required">*</span>
                      </label>
                      <select
                        value={waterIncidentData.medicalState.fitnessStatus}
                        onChange={(e) =>
                          handleMedicalStateChange(
                            "fitnessStatus",
                            e.target.value
                          )
                        }
                        required
                      >
                        <option value="">Select...</option>
                        <option value="Athletic">Athletic</option>
                        <option value="Average">Average</option>
                        <option value="Below Average">Below Average</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Auto-Generated Description */}
              <div className="form-section description-section">
                <h3 className="section-title">Auto-Generated Description</h3>
                <div className="form-group">
                  <label>Description Preview</label>
                  <textarea
                    rows="4"
                    value={waterIncidentData.description}
                    onChange={(e) =>
                      handleWaterIncidentChange("description", e.target.value)
                    }
                    placeholder="Description will auto-generate based on the information above..."
                    className="description-textarea"
                  />
                  <p className="help-text">
                    This description is automatically generated from your inputs
                    above. You can edit it manually if needed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn-secondary-modal"
              onClick={() => {
                setShowNewIncidentModal(false);
                setIncidentStep(2);
                setSearchType("water");
              }}
            >
              Cancel
            </button>
            <button
              className="btn-primary-modal"
              onClick={handleCreateWaterIncident}
            >
              Create Incident
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== MAP PICKER MODAL ====================

  const renderMapPickerModal = () => {
    if (!showMapPicker) return null;

    const handleConfirmPosition = () => {
      // Update the incident form with selected coordinates
      handleWaterIncidentChange("lastKnownPosition", {
        lat: mapPickerPosition.lat.toFixed(6),
        lng: mapPickerPosition.lng.toFixed(6),
      });
      setShowMapPicker(false);
      mapPickerMarkerRef.current = null;
    };

    return (
      <div
        className="modal-overlay-map-picker"
        onClick={() => {
          setShowMapPicker(false);
          mapPickerMarkerRef.current = null;
        }}
      >
        <div
          className="modal-content-map-picker"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header-map-picker">
            <h2>Select Last Known Position</h2>
            <button
              className="close-btn"
              onClick={() => {
                setShowMapPicker(false);
                mapPickerMarkerRef.current = null;
              }}
            >
              <Icons.Close />
            </button>
          </div>

          <div className="modal-body-map-picker">
            <div
              style={{ height: "100%", width: "100%", position: "relative" }}
            >
              {/* Map Container */}
              <div
                ref={mapPickerMapRef}
                style={{ height: "100%", width: "100%" }}
              />

              {/* Coordinate Display */}
              <div className="map-picker-coords-display">
                <div style={{ marginBottom: "4px" }}>
                  <strong>Latitude:</strong> {mapPickerPosition.lat.toFixed(6)}
                </div>
                <div>
                  <strong>Longitude:</strong> {mapPickerPosition.lng.toFixed(6)}
                </div>
              </div>

              {/* Instructions */}
              <div className="map-picker-instructions">
                Click on map or drag marker to select position
              </div>
            </div>
          </div>

          <div className="modal-footer-map-picker">
            <button
              className="btn-secondary-modal"
              onClick={() => {
                setShowMapPicker(false);
                mapPickerMarkerRef.current = null;
              }}
            >
              Cancel
            </button>
            <button
              className="btn-primary-modal"
              onClick={handleConfirmPosition}
            >
              Confirm Position
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPreviousIncidentsModal = () => {
    if (!showPreviousIncidents) return null;

    // Filter for closed incidents only
    const closedIncidents = incidents.filter((inc) => inc.status === "closed");

    // Format date helper
    const formatDate = (isoString) => {
      const date = new Date(isoString);
      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };

    // Calculate duration helper
    const calculateDuration = (startTime, endTime) => {
      if (!startTime || !endTime) return "N/A";
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end - start;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHours}h ${diffMins}m`;
    };

    return (
      <div
        className="modal-overlay"
        onClick={() => setShowPreviousIncidents(false)}
      >
        <div
          className="modal-content modal-large"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Previous Incidents ({closedIncidents.length})</h2>
            <button
              className="close-btn"
              onClick={() => setShowPreviousIncidents(false)}
            >
              <Icons.Close />
            </button>
          </div>

          <div className="modal-body">
            {closedIncidents.length === 0 ? (
              <div className="empty-state">
                <p>No closed incidents yet.</p>
                <p className="empty-state-subtitle">
                  Incidents marked as "Closed" will appear here.
                </p>
              </div>
            ) : (
              <div className="incidents-list">
                {closedIncidents.map((incident) => (
                  <div key={incident.id} className="incident-item">
                    <div className="incident-item-header">
                      <h4>
                        {incident.incidentNumber} - {incident.name}
                      </h4>
                      <span className="status-badge closed">CLOSED</span>
                    </div>
                    <div className="incident-item-details">
                      <div className="detail">
                        <strong>Type:</strong>{" "}
                        {incident.searchType || incident.type}
                      </div>
                      <div className="detail">
                        <strong>Started:</strong>{" "}
                        {formatDate(incident.createdAt)}
                      </div>
                      <div className="detail">
                        <strong>Ended:</strong> {formatDate(incident.closedAt)}
                      </div>
                      <div className="detail">
                        <strong>Duration:</strong>{" "}
                        {calculateDuration(
                          incident.createdAt,
                          incident.closedAt
                        )}
                      </div>
                      <div className="detail">
                        <strong>Position:</strong>{" "}
                        {Number(incident.position.lat).toFixed(6)},{" "}
                        {Number(incident.position.lng).toFixed(6)}
                      </div>
                    </div>
                    <button
                      className="btn-view-details"
                      onClick={() => {
                        setActiveIncident(incident);
                        setShowPreviousIncidents(false);
                        setCurrentView("incident");
                      }}
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              className="btn-secondary-modal"
              onClick={() => setShowPreviousIncidents(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTeamManagementModal = () => {
    if (!showTeamManagement) return null;

    return (
      <div
        className="modal-overlay"
        onClick={() => setShowTeamManagement(false)}
      >
        <div
          className="modal-content modal-large"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Team Management</h2>
            <button
              className="close-btn"
              onClick={() => setShowTeamManagement(false)}
            >
              <Icons.Close />
            </button>
          </div>

          <div className="modal-body">
            <div className="settings-section">
              <h3>Invite New Team Member</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={invitationForm.firstName}
                    onChange={(e) =>
                      setInvitationForm({
                        ...invitationForm,
                        firstName: e.target.value,
                      })
                    }
                    placeholder="John"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={invitationForm.lastName}
                    onChange={(e) =>
                      setInvitationForm({
                        ...invitationForm,
                        lastName: e.target.value,
                      })
                    }
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={invitationForm.email}
                    onChange={(e) =>
                      setInvitationForm({
                        ...invitationForm,
                        email: e.target.value,
                      })
                    }
                    placeholder="john@rescue.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={invitationForm.phone}
                    onChange={(e) =>
                      setInvitationForm({
                        ...invitationForm,
                        phone: e.target.value,
                      })
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={invitationForm.role}
                  onChange={(e) =>
                    setInvitationForm({
                      ...invitationForm,
                      role: e.target.value,
                    })
                  }
                >
                  <option value="end_user">Team Member</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <button
                className="btn-primary-modal"
                onClick={handleSendInvitation}
              >
                <Icons.Send /> Send Invitation
              </button>
            </div>

            <div className="settings-section">
              <h3>Current Team Members ({teamMembers.length})</h3>
              <div className="team-members-list">
                {teamMembers.map((member) => (
                  <div key={member.id} className="team-member-item">
                    <div className="member-info">
                      <div className="member-name">{member.name}</div>
                      <div className="member-details">
                        <span>{member.email}</span>
                        <span className="separator">•</span>
                        <span>
                          {member.role === "admin"
                            ? "Administrator"
                            : "Team Member"}
                        </span>
                        <span className="separator">•</span>
                        <span>Joined {member.joinedDate}</span>
                      </div>
                    </div>
                    <div className="member-actions">
                      <span className={`status-badge ${member.status}`}>
                        {member.status}
                      </span>
                      <button
                        className="btn-icon-delete"
                        onClick={() => handleRemoveTeamMember(member.id)}
                        title="Remove team member"
                      >
                        <Icons.Delete />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn-secondary-modal"
              onClick={() => setShowTeamManagement(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderResourcesModal = () => {
    if (!showResources) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowResources(false)}>
        <div
          className="modal-content modal-large"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Resources & Equipment</h2>
            <button
              className="close-btn"
              onClick={() => setShowResources(false)}
            >
              <Icons.Close />
            </button>
          </div>

          <div className="modal-body">
            <div className="resources-header">
              <button className="btn-primary-modal" onClick={handleAddResource}>
                <Icons.Add /> Add Resource
              </button>
            </div>

            <div className="resources-list">
              {resources.map((resource) => (
                <div key={resource.id} className="resource-item">
                  <div className="resource-info">
                    <h4>{resource.name}</h4>
                    <div className="resource-details">
                      <span>
                        <strong>Type:</strong> {resource.type}
                      </span>
                      <span className="separator">•</span>
                      <span>
                        <strong>Location:</strong> {resource.location}
                      </span>
                    </div>
                  </div>
                  <div className="resource-actions">
                    <span className={`status-badge ${resource.status}`}>
                      {resource.status}
                    </span>
                    <button
                      className="btn-icon-delete"
                      onClick={() => handleRemoveResource(resource.id)}
                      title="Remove resource"
                    >
                      <Icons.Delete />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn-secondary-modal"
              onClick={() => setShowResources(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCommunicationsModal = () => {
    if (!showCommunications) return null;

    return (
      <div
        className="modal-overlay"
        onClick={() => setShowCommunications(false)}
      >
        <div
          className="modal-content modal-large"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Team Communications</h2>
            <button
              className="close-btn"
              onClick={() => setShowCommunications(false)}
            >
              <Icons.Close />
            </button>
          </div>

          <div className="modal-body">
            <div className="messages-container">
              <div className="messages-list">
                {messages.map((message) => (
                  <div key={message.id} className="message-item">
                    <div className="message-header">
                      <strong>{message.sender}</strong>
                      <span className="message-time">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="message-text">{message.text}</div>
                  </div>
                ))}
              </div>

              <div className="message-input-container">
                <input
                  type="text"
                  className="message-input"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                />
                <button
                  className="btn-send-message"
                  onClick={handleSendMessage}
                >
                  <Icons.Send />
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn-secondary-modal"
              onClick={() => setShowCommunications(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderReportsModal = () => {
    if (!showReports) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowReports(false)}>
        <div
          className="modal-content modal-large"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Reports & Analytics</h2>
            <button className="close-btn" onClick={() => setShowReports(false)}>
              <Icons.Close />
            </button>
          </div>

          <div className="modal-body">
            <div className="reports-grid">
              <div className="report-card">
                <h4>Total Incidents</h4>
                <div className="stat-value">{previousIncidents.length}</div>
                <p>All-time incidents</p>
              </div>

              <div className="report-card">
                <h4>Average Response Time</h4>
                <div className="stat-value">2.9 hrs</div>
                <p>Last 30 days</p>
              </div>

              <div className="report-card">
                <h4>Team Members</h4>
                <div className="stat-value">{teamMembers.length}</div>
                <p>Active members</p>
              </div>

              <div className="report-card">
                <h4>Resources</h4>
                <div className="stat-value">{resources.length}</div>
                <p>Total resources</p>
              </div>
            </div>

            <div className="reports-section">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <span className="activity-time">2 hours ago</span>
                  <span className="activity-text">
                    Incident "Missing Hiker - Mt. Peak" closed
                  </span>
                </div>
                <div className="activity-item">
                  <span className="activity-time">5 hours ago</span>
                  <span className="activity-text">
                    New team member joined: Jane Doe
                  </span>
                </div>
                <div className="activity-item">
                  <span className="activity-time">Yesterday</span>
                  <span className="activity-text">
                    Resource "Rescue Boat Alpha" deployed
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn-secondary-modal"
              onClick={() => setShowReports(false)}
            >
              Close
            </button>
            <button className="btn-primary-modal">Export Report</button>
          </div>
        </div>
      </div>
    );
  };

  const renderTrainingModal = () => {
    if (!showTraining) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowTraining(false)}>
        <div
          className="modal-content modal-large"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Training & Help</h2>
            <button
              className="close-btn"
              onClick={() => setShowTraining(false)}
            >
              <Icons.Close />
            </button>
          </div>

          <div className="modal-body">
            <div className="settings-section">
              <h3>Quick Start Guide</h3>
              <div className="training-list">
                <div className="training-item">
                  <h4>📝 Creating Your First Incident</h4>
                  <p>
                    Learn how to create and manage search and rescue incidents
                  </p>
                  <button className="btn-view-details">View Tutorial</button>
                </div>
                <div className="training-item">
                  <h4>👥 Team Management</h4>
                  <p>Invite team members and manage permissions</p>
                  <button className="btn-view-details">View Tutorial</button>
                </div>
                <div className="training-item">
                  <h4>🗺️ Using the Map Interface</h4>
                  <p>Navigate and utilize GPS tracking features</p>
                  <button className="btn-view-details">View Tutorial</button>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Help & Support</h3>
              <div className="support-info">
                <p>
                  <strong>Email Support:</strong> support@rescuegps.com
                </p>
                <p>
                  <strong>Phone:</strong> 1-800-RESCUE-1
                </p>
                <p>
                  <strong>Documentation:</strong> docs.rescuegps.com
                </p>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn-secondary-modal"
              onClick={() => setShowTraining(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsModal = () => {
    if (!showSettings) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowSettings(false)}>
        <div
          className="modal-content modal-large"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Settings & Subscription</h2>
            <button
              className="close-btn"
              onClick={() => setShowSettings(false)}
            >
              <Icons.Close />
            </button>
          </div>

          <div className="modal-body">
            <div className="settings-section">
              <h3>Profile Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={userData.firstName}
                    onChange={(e) =>
                      setUserData({ ...userData, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={userData.lastName}
                    onChange={(e) =>
                      setUserData({ ...userData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={userData.email} disabled />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={userData.phone}
                    onChange={(e) =>
                      setUserData({ ...userData, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Rank/Title</label>
                <input
                  type="text"
                  value={userData.rank}
                  onChange={(e) =>
                    setUserData({ ...userData, rank: e.target.value })
                  }
                  placeholder="e.g., Captain, Lieutenant"
                />
              </div>
            </div>

            <div className="settings-section">
              <h3>Subscription</h3>
              <div className="subscription-info">
                <div className="subscription-card">
                  <h4>Professional Plan</h4>
                  <div className="subscription-price">$99/month</div>
                  <ul>
                    <li>✓ Unlimited incidents</li>
                    <li>✓ Up to 50 team members</li>
                    <li>✓ Advanced analytics</li>
                    <li>✓ Priority support</li>
                  </ul>
                  <button className="btn-primary-modal">
                    Manage Subscription
                  </button>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Notification Preferences</h3>
              <div className="toggles-container">
                <div className="toggle-item">
                  <div className="toggle-label">
                    <strong>Email Notifications</strong>
                    <span>Receive updates via email</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={userData.notifications.email}
                      onChange={() => handleNotificationToggle("email")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-label">
                    <strong>SMS Notifications</strong>
                    <span>Receive updates via text message</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={userData.notifications.sms}
                      onChange={() => handleNotificationToggle("sms")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-label">
                    <strong>Push Notifications</strong>
                    <span>Receive push notifications on your device</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={userData.notifications.push}
                      onChange={() => handleNotificationToggle("push")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-label">
                    <strong>Incident Alerts</strong>
                    <span>Get notified when new incidents are created</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={userData.notifications.incidents}
                      onChange={() => handleNotificationToggle("incidents")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-label">
                    <strong>Team Updates</strong>
                    <span>Notifications about team member activity</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={userData.notifications.teamUpdates}
                      onChange={() => handleNotificationToggle("teamUpdates")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn-secondary-modal"
              onClick={() => setShowSettings(false)}
            >
              Cancel
            </button>
            <button className="btn-primary-modal" onClick={handleSaveSettings}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== MAIN DASHBOARD ====================

  if (!isLoggedIn) {
    return <div>Loading...</div>;
  }

  // Render incident view if active
  if (currentView === "incident" && activeIncident) {
    return (
      <div className={`app ${isDarkMode ? "dark-mode" : ""}`}>
        {/* Top Navigation Bar */}
        <div className="top-nav">
          <div className="nav-left">
            <button
              className="back-to-dashboard-btn"
              onClick={handleBackToDashboard}
            >
              ← Back to Dashboard
            </button>
          </div>

          <div className="nav-center">
            <div className="incident-header-info">
              <h1 className="nav-title">{activeIncident.fullName}</h1>
              <div className="incident-header-controls">
                <span className="incident-status-badge">ACTIVE</span>
                <button
                  className="btn-end-incident"
                  onClick={handleEndIncident}
                  title="End this incident and move to Previous Incidents"
                >
                  End Incident
                </button>
              </div>
            </div>
          </div>

          <div className="nav-right">
            <button
              className="theme-toggle-btn-nav"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={
                isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
              }
            >
              {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
            </button>
            <button
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <Icons.Logout />
            </button>
            <div className="profile-btn" title={userData.fullName}>
              {getUserInitials()}
            </div>
          </div>
        </div>

        {/* Incident View Layout */}
        <div className="incident-view-container-new">
          {/* Environmental Dashboard - Left Side */}
          {renderEnvironmentalDashboard()}

          {/* Map View - Center */}
          <div className="map-container-main-new">
            <div
              ref={incidentMapRef}
              style={{
                width: "100%",
                height: "100%",
                minHeight: "500px",
              }}
            />
          </div>

          {/* Units Panel - Right Side */}
          {renderUnitsPanel()}
        </div>

        {/* Modals */}
        {showLeewayFactors && renderLeewayFactorsModal()}
      </div>
    );
  }

  // Default dashboard view
  return (
    <div className={`app ${isDarkMode ? "dark-mode" : ""}`}>
      {/* Top Navigation Bar */}
      <div className="top-nav">
        <div className="nav-left">
          <Icons.RescueGPSLogo />
        </div>

        <div className="nav-center">
          <h1 className="nav-title">Command Center</h1>
          <div className="active-incidents-container">
            {incidents
              .filter((inc) => inc.status === "active")
              .map((incident) => (
                <div
                  key={incident.id}
                  className={`active-incident-indicator ${
                    activeIncident?.id === incident.id ? "current" : ""
                  }`}
                  onClick={() => {
                    setActiveIncident(incident);
                    setCurrentView("incident");
                  }}
                >
                  <div className="incident-indicator-pulse"></div>
                  <div className="incident-indicator-content">
                    <span className="incident-indicator-label">ACTIVE:</span>
                    <span className="incident-indicator-name">
                      {incident.incidentNumber}
                    </span>
                    <span className="incident-indicator-subtitle">
                      {incident.name}
                    </span>
                  </div>
                  <div className="incident-indicator-arrow">→</div>
                </div>
              ))}
          </div>
        </div>

        <div className="nav-right">
          <button
            className="theme-toggle-btn-nav"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
          </button>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <Icons.Logout />
          </button>
          <div className="profile-btn" title={userData.fullName}>
            {getUserInitials()}
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-container-modern">
        <div className="dashboard-grid-modern">
          <button className="dashboard-btn" onClick={handleCreateIncident}>
            <div className="btn-icon">
              <Icons.NewIncident />
            </div>
            <div className="btn-label">New Incident</div>
          </button>

          <button className="dashboard-btn" onClick={handleJoinIncident}>
            <div className="btn-icon">
              <Icons.JoinIncident />
            </div>
            <div className="btn-label">Join Active Incident</div>
          </button>

          <button className="dashboard-btn" onClick={handlePreviousIncidents}>
            <div className="btn-icon">
              <Icons.PreviousIncidents />
            </div>
            <div className="btn-label">Previous Incidents</div>
          </button>

          <button className="dashboard-btn" onClick={handleTeamManagement}>
            <div className="btn-icon">
              <Icons.TeamManagement />
            </div>
            <div className="btn-label">Team Management</div>
          </button>

          <button className="dashboard-btn" onClick={handleResources}>
            <div className="btn-icon">
              <Icons.Resources />
            </div>
            <div className="btn-label">Resources</div>
          </button>

          <button className="dashboard-btn" onClick={handleCommunications}>
            <div className="btn-icon">
              <Icons.Communications />
            </div>
            <div className="btn-label">Communications</div>
          </button>

          <button className="dashboard-btn" onClick={handleReports}>
            <div className="btn-icon">
              <Icons.Reports />
            </div>
            <div className="btn-label">Reports/Analytics</div>
          </button>

          <button
            className="dashboard-btn"
            onClick={() => setShowSettings(true)}
          >
            <div className="btn-icon">
              <Icons.Settings />
            </div>
            <div className="btn-label">Settings & Subscription</div>
          </button>

          <button className="dashboard-btn" onClick={handleTraining}>
            <div className="btn-icon">
              <Icons.Training />
            </div>
            <div className="btn-label">Training and Help</div>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showNewIncidentModal && renderNewIncidentModal()}
      {showMapPicker && renderMapPickerModal()}
      {showSettings && renderSettingsModal()}
      {showPreviousIncidents && renderPreviousIncidentsModal()}
      {showTeamManagement && renderTeamManagementModal()}
      {showResources && renderResourcesModal()}
      {showCommunications && renderCommunicationsModal()}
      {showReports && renderReportsModal()}
      {showTraining && renderTrainingModal()}
    </div>
  );
}
