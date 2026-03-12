import { useEffect, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CancelIcon from "@mui/icons-material/Cancel";
import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  NativeSelect,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useParams } from "react-router-dom";

function buildAuthHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function isValidPostalCode(value) {
  return /^[0-9-]{1,15}$/.test(String(value || ""));
}

export default function UserEditPage({ token, onBackToList }) {
  const { userId = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [initialValues, setInitialValues] = useState({
    email: "",
    displayName: "",
    roleId: "",
    street: "",
    city: "",
    postalCode: "",
    country: ""
  });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [userResponse, rolesResponse] = await Promise.all([
          fetch(`/api/admin/users/${encodeURIComponent(userId)}`, { headers: buildAuthHeaders(token) }),
          fetch("/api/admin/roles", { headers: buildAuthHeaders(token) })
        ]);
        const userPayload = await userResponse.json();
        const rolesPayload = await rolesResponse.json();
        if (!userResponse.ok || !rolesResponse.ok) {
          throw new Error(userPayload.message || rolesPayload.message || "Unable to load user details");
        }
        if (!isMounted) {
          return;
        }
        const loadedUser = userPayload.user || {};
        const loadedRoleId = String(loadedUser.roleId || "");
        setRoles(rolesPayload.roles || []);
        setEmail(String(loadedUser.email || ""));
        setDisplayName(String(loadedUser.displayName || ""));
        setRoleId(loadedRoleId);
        setStreet(String(loadedUser.street || ""));
        setCity(String(loadedUser.city || ""));
        setPostalCode(String(loadedUser.postalCode || ""));
        setCountry(String(loadedUser.country || ""));
        setInitialValues({
          email: String(loadedUser.email || ""),
          displayName: String(loadedUser.displayName || ""),
          roleId: loadedRoleId,
          street: String(loadedUser.street || ""),
          city: String(loadedUser.city || ""),
          postalCode: String(loadedUser.postalCode || ""),
          country: String(loadedUser.country || "")
        });
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Unable to load user details");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [token, userId]);

  function validateInputs() {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedDisplayName = String(displayName || "").trim().replace(/\s+/g, " ");
    const normalizedStreet = String(street || "").trim().replace(/\s+/g, " ");
    const normalizedCity = String(city || "").trim().replace(/\s+/g, " ");
    const normalizedPostalCode = String(postalCode || "").trim();
    const normalizedCountry = String(country || "").trim().replace(/\s+/g, " ");
    const nextRoleId = Number.parseInt(String(roleId || ""), 10);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setError("A valid email is required");
      return null;
    }
    if (!normalizedDisplayName) {
      setError("Display name is required");
      return null;
    }
    if (!Number.isInteger(nextRoleId) || nextRoleId <= 0) {
      setError("A role selection is required");
      return null;
    }
    if (!normalizedStreet) {
      setError("Street is required");
      return null;
    }
    if (normalizedStreet.length > 50) {
      setError("Street must be 50 characters or fewer");
      return null;
    }
    if (!normalizedCity) {
      setError("City is required");
      return null;
    }
    if (normalizedCity.length > 30) {
      setError("City must be 30 characters or fewer");
      return null;
    }
    if (!normalizedPostalCode || !isValidPostalCode(normalizedPostalCode)) {
      setError("Postal code must contain only digits and '-' and be 15 characters or fewer");
      return null;
    }
    if (!normalizedCountry) {
      setError("Country is required");
      return null;
    }
    if (normalizedCountry.length > 30) {
      setError("Country must be 30 characters or fewer");
      return null;
    }

    return {
      email: normalizedEmail,
      displayName: normalizedDisplayName,
      roleId: nextRoleId,
      street: normalizedStreet,
      city: normalizedCity,
      postalCode: normalizedPostalCode,
      country: normalizedCountry
    };
  }

  async function onSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const payload = validateInputs();
    if (!payload) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: "PUT",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(payload)
      });
      const responsePayload = await response.json();
      if (!response.ok) {
        setError(responsePayload.message || "Unable to update user");
        return;
      }
      const updatedUser = responsePayload.user || {};
      const nextRoleId = String(updatedUser.roleId || payload.roleId);
      setEmail(String(updatedUser.email || payload.email));
      setDisplayName(String(updatedUser.displayName || payload.displayName));
      setRoleId(nextRoleId);
      setStreet(String(updatedUser.street || payload.street));
      setCity(String(updatedUser.city || payload.city));
      setPostalCode(String(updatedUser.postalCode || payload.postalCode));
      setCountry(String(updatedUser.country || payload.country));
      setInitialValues({
        email: String(updatedUser.email || payload.email),
        displayName: String(updatedUser.displayName || payload.displayName),
        roleId: nextRoleId,
        street: String(updatedUser.street || payload.street),
        city: String(updatedUser.city || payload.city),
        postalCode: String(updatedUser.postalCode || payload.postalCode),
        country: String(updatedUser.country || payload.country)
      });
      setSuccess(`Updated ${updatedUser.email || payload.email}`);
    } catch {
      setError("Unable to update user");
    } finally {
      setSaving(false);
    }
  }

  function onCancelEdit() {
    setEmail(initialValues.email);
    setDisplayName(initialValues.displayName);
    setRoleId(initialValues.roleId);
    setStreet(initialValues.street);
    setCity(initialValues.city);
    setPostalCode(initialValues.postalCode);
    setCountry(initialValues.country);
    setSuccess("");
    setError("");
    onBackToList();
  }

  if (loading) {
    return (
      <Card data-cy="admin-user-edit-page-loading" sx={{ mt: 2 }}>
        <CardContent>
          <Typography data-cy="admin-user-edit-title" variant="h5">Edit user</Typography>
          <Typography>Loading user details...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-cy="admin-user-edit-page" sx={{ mt: 2 }}>
      <CardContent>
        <Stack component="form" onSubmit={onSave} spacing={2}>
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography data-cy="admin-user-edit-title" variant="h5">Edit user</Typography>
            <Button data-cy="admin-user-edit-back" onClick={onBackToList} startIcon={<ArrowBackIcon />} type="button" variant="outlined">
              Back to users
            </Button>
          </Stack>
          <TextField
            id="admin-user-email"
            inputProps={{ "data-cy": "admin-user-email" }}
            label="Email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
          <TextField
            id="admin-user-display-name"
            inputProps={{ "data-cy": "admin-user-display-name" }}
            label="Display name"
            onChange={(event) => setDisplayName(event.target.value)}
            value={displayName}
          />
          <TextField
            id="admin-user-street"
            inputProps={{ "data-cy": "admin-user-street" }}
            label="Street"
            onChange={(event) => setStreet(event.target.value)}
            value={street}
          />
          <TextField
            id="admin-user-city"
            inputProps={{ "data-cy": "admin-user-city" }}
            label="City"
            onChange={(event) => setCity(event.target.value)}
            value={city}
          />
          <TextField
            id="admin-user-postal-code"
            inputProps={{ "data-cy": "admin-user-postal-code" }}
            label="Zip/Postal code"
            onChange={(event) => setPostalCode(event.target.value)}
            value={postalCode}
          />
          <TextField
            id="admin-user-country"
            inputProps={{ "data-cy": "admin-user-country" }}
            label="Country"
            onChange={(event) => setCountry(event.target.value)}
            value={country}
          />
          <FormControl>
            <InputLabel htmlFor="admin-user-role-native">Role</InputLabel>
            <NativeSelect
              id="admin-user-role-native"
              inputProps={{ "data-cy": "admin-user-role", "aria-label": "Select user role" }}
              onChange={(event) => setRoleId(event.target.value)}
              value={roleId}
            >
              {roles.map((role) => (
                <option key={role.id} value={String(role.id)}>
                  {role.name}
                </option>
              ))}
            </NativeSelect>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <Button
              data-cy="admin-user-save"
              disabled={saving}
              startIcon={<SaveIcon />}
              type="submit"
            >
              {saving ? "Saving..." : "Save user"}
            </Button>
            <Button
              data-cy="admin-user-cancel"
              disabled={saving}
              onClick={onCancelEdit}
              startIcon={<CancelIcon />}
              type="button"
              variant="outlined"
            >
              Cancel edit
            </Button>
          </Stack>
          {success ? <Alert data-cy="admin-user-success" severity="success">{success}</Alert> : null}
          {error ? <Alert data-cy="admin-user-error" severity="error">{error}</Alert> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
