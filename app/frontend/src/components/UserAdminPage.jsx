import { useEffect, useMemo, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  List,
  ListItem,
  NativeSelect,
  Stack,
  TextField,
  Typography
} from "@mui/material";

function buildAuthHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

export default function UserAdminPage({ token, onBack }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedUser = useMemo(
    () => users.find((entry) => String(entry.id) === selectedUserId) || null,
    [users, selectedUserId]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [usersResponse, rolesResponse] = await Promise.all([
          fetch("/api/admin/users", { headers: buildAuthHeaders(token) }),
          fetch("/api/admin/roles", { headers: buildAuthHeaders(token) })
        ]);
        const usersPayload = await usersResponse.json();
        const rolesPayload = await rolesResponse.json();
        if (!usersResponse.ok || !rolesResponse.ok) {
          throw new Error(usersPayload.message || rolesPayload.message || "Unable to load admin user data");
        }
        if (!isMounted) {
          return;
        }
        const nextUsers = usersPayload.users || [];
        const nextRoles = rolesPayload.roles || [];
        setUsers(nextUsers);
        setRoles(nextRoles);
        if (nextUsers.length > 0) {
          const firstUser = nextUsers[0];
          setSelectedUserId(String(firstUser.id));
          setEmail(firstUser.email || "");
          setDisplayName(firstUser.displayName || "");
          setRoleId(String(firstUser.roleId || ""));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Unable to load admin user data");
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
  }, [token]);

  function onSelectUser(nextUserId) {
    setSelectedUserId(nextUserId);
    const user = users.find((entry) => String(entry.id) === nextUserId);
    if (!user) {
      setEmail("");
      setDisplayName("");
      setRoleId("");
      return;
    }
    setEmail(user.email || "");
    setDisplayName(user.displayName || "");
    setRoleId(String(user.roleId || ""));
    setSuccess("");
    setError("");
  }

  async function onSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedUserId) {
      setError("Please select a user");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(selectedUserId)}`, {
        method: "PUT",
        headers: buildAuthHeaders(token),
        body: JSON.stringify({
          email,
          displayName,
          roleId: Number.parseInt(roleId, 10)
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message || "Unable to update user");
        return;
      }
      const updatedUser = payload.user;
      setUsers((current) =>
        current.map((entry) => (entry.id === updatedUser.id ? { ...entry, ...updatedUser } : entry))
      );
      setSuccess(`Updated ${updatedUser.email}`);
    } catch {
      setError("Unable to update user");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card data-cy="admin-users-page-loading" sx={{ mt: 2 }}>
        <CardContent>
          <Typography data-cy="admin-users-title" variant="h5">User admin</Typography>
          <Typography>Loading users...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-cy="admin-users-page" sx={{ mt: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography data-cy="admin-users-title" variant="h5">User admin</Typography>
            <Button data-cy="admin-users-back" onClick={onBack} startIcon={<ArrowBackIcon />} type="button" variant="outlined">
              Back
            </Button>
          </Stack>

          <List data-cy="admin-users-list" sx={{ p: 0 }}>
            {users.map((user) => (
              <ListItem key={user.id} sx={{ px: 0, py: 0.25 }}>
                <Typography variant="body2">{user.email} ({user.role})</Typography>
              </ListItem>
            ))}
          </List>

          <FormControl>
            <InputLabel htmlFor="admin-user-select-native">User</InputLabel>
            <NativeSelect
              id="admin-user-select-native"
              inputProps={{ "data-cy": "admin-user-select", "aria-label": "Select user for editing" }}
              onChange={(event) => onSelectUser(event.target.value)}
              value={selectedUserId}
            >
              {users.map((user) => (
                <option key={user.id} value={String(user.id)}>
                  {user.email}
                </option>
              ))}
            </NativeSelect>
          </FormControl>

          <Stack component="form" onSubmit={onSave} spacing={2}>
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
            <Button
              data-cy="admin-user-save"
              disabled={saving || !selectedUserId}
              startIcon={<SaveIcon />}
              type="submit"
            >
              {saving ? "Saving..." : "Save user"}
            </Button>
          </Stack>

          {success ? <Alert data-cy="admin-user-success" severity="success">{success}</Alert> : null}
          {error ? <Alert data-cy="admin-user-error" severity="error">{error}</Alert> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
