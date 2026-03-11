import { useEffect, useMemo, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  Box,
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
import { useLocation, useNavigate } from "react-router-dom";

const PAGE_SIZE_OPTIONS = Object.freeze([10, 20, 50]);
const DEFAULT_PAGE_SIZE = 10;

function parsePositiveInteger(value, fallbackValue) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function isPrintableSearchText(value) {
  return /^[\x20-\x7E]*$/.test(String(value || ""));
}

function buildAdminSearch(currentSearch, page, pageSize, query = "") {
  const params = new URLSearchParams(currentSearch);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  const normalizedQuery = String(query || "").trim();
  if (normalizedQuery) {
    params.set("q", normalizedQuery);
  } else {
    params.delete("q");
  }
  return `?${params.toString()}`;
}

function buildAuthHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

export default function UserAdminPage({ token, onBack }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentSearchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const activeSearchQuery = String(currentSearchParams.get("q") || "").trim();
  const requestedPageSize = parsePositiveInteger(currentSearchParams.get("pageSize"), DEFAULT_PAGE_SIZE);
  const pageSize = PAGE_SIZE_OPTIONS.includes(requestedPageSize) ? requestedPageSize : DEFAULT_PAGE_SIZE;
  const requestedPage = parsePositiveInteger(currentSearchParams.get("page"), 1);
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState(() => activeSearchQuery);
  const [searchError, setSearchError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filteredUsers = useMemo(() => {
    if (!activeSearchQuery) {
      return users;
    }
    const normalizedQuery = activeSearchQuery.toLowerCase();
    return users.filter((user) => {
      return [
        String(user.email || "").toLowerCase(),
        String(user.displayName || "").toLowerCase(),
        String(user.role || "").toLowerCase()
      ].some((value) => value.includes(normalizedQuery));
    });
  }, [users, activeSearchQuery]);

  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const pagedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);
  const disablePrev = currentPage <= 1 || totalItems <= pageSize;
  const disableNext = currentPage >= totalPages || totalItems <= pageSize;

  useEffect(() => {
    setSearchInput(activeSearchQuery);
  }, [activeSearchQuery]);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      setLoading(true);
      setError("");
      try {
        const usersResponse = await fetch("/api/admin/users", { headers: buildAuthHeaders(token) });
        const usersPayload = await usersResponse.json();
        if (!usersResponse.ok) {
          throw new Error(usersPayload.message || "Unable to load admin user data");
        }
        if (!isMounted) {
          return;
        }
        setUsers(usersPayload.users || []);
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

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    const normalizedSearch = buildAdminSearch(location.search, currentPage, pageSize, activeSearchQuery);
    if (location.search !== normalizedSearch) {
      navigate({ pathname: "/admin/users", search: normalizedSearch }, { replace: true });
    }
  }, [location.search, currentPage, pageSize, activeSearchQuery, navigate]);

  function goToPage(nextPage, nextPageSize = pageSize, replace = false, nextSearchQuery = activeSearchQuery) {
    const boundedPageSize = PAGE_SIZE_OPTIONS.includes(nextPageSize) ? nextPageSize : DEFAULT_PAGE_SIZE;
    const boundedTotalPages = Math.max(1, Math.ceil(filteredUsers.length / boundedPageSize));
    const boundedPage = Math.min(Math.max(1, nextPage), boundedTotalPages);
    navigate(
      {
        pathname: "/admin/users",
        search: buildAdminSearch(location.search, boundedPage, boundedPageSize, nextSearchQuery)
      },
      { replace }
    );
  }

  function submitSearch(event) {
    event.preventDefault();
    const normalizedQuery = String(searchInput || "").trim();
    if (!normalizedQuery) {
      setSearchError("");
      goToPage(1, pageSize, false, "");
      return;
    }
    if (normalizedQuery.length > 20) {
      setSearchError("Search query must be 20 characters or fewer");
      return;
    }
    if (!isPrintableSearchText(normalizedQuery)) {
      setSearchError("Search query contains unsupported characters");
      return;
    }
    setSearchError("");
    goToPage(1, pageSize, false, normalizedQuery);
  }

  function clearSearch() {
    setSearchInput("");
    setSearchError("");
    goToPage(1, pageSize, false, "");
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
          <Stack
            alignItems={{ xs: "stretch", md: "center" }}
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Typography variant="body2">
              Manage users and roles
            </Typography>
            <Box component="form" data-cy="admin-users-search-form" onSubmit={submitSearch} sx={{ width: { xs: "100%", md: "auto" } }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  inputProps={{ "data-cy": "admin-users-search-input", maxLength: 20 }}
                  label="Search users"
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    if (searchError) {
                      setSearchError("");
                    }
                  }}
                  size="small"
                  value={searchInput}
                />
                <Button data-cy="admin-users-search-submit" type="submit" variant="contained">
                  Search
                </Button>
                <Button
                  data-cy="admin-users-search-clear"
                  disabled={!activeSearchQuery && !searchInput}
                  onClick={clearSearch}
                  type="button"
                  variant="outlined"
                >
                  Clear
                </Button>
              </Stack>
            </Box>
          </Stack>
          {searchError ? <Alert data-cy="admin-users-search-error" severity="error">{searchError}</Alert> : null}
          {error ? <Alert data-cy="admin-user-error" severity="error">{error}</Alert> : null}
          {!error && totalItems === 0 ? (
            <Typography data-cy="admin-users-no-results" variant="body2">No users found</Typography>
          ) : null}
          <List data-cy="admin-users-list" sx={{ p: 0 }}>
            {pagedUsers.map((user) => (
              <ListItem
                divider
                key={user.id}
                sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 2 }}
              >
                <Stack spacing={0.25}>
                  <Typography data-cy={`admin-user-row-email-${user.id}`} sx={{ fontWeight: 500 }} variant="body2">
                    {user.email}
                  </Typography>
                  <Typography variant="caption">
                    {user.displayName || "No display name"} ({user.role})
                  </Typography>
                </Stack>
                <Button
                  data-cy={`admin-user-edit-${user.id}`}
                  onClick={() => navigate(`/admin/users/${encodeURIComponent(user.id)}/edit`, { state: { fromSearch: location.search } })}
                  size="small"
                  startIcon={<EditIcon />}
                  type="button"
                  variant="outlined"
                >
                  Edit user
                </Button>
              </ListItem>
            ))}
          </List>
          <Stack
            alignItems="center"
            data-cy="admin-users-pagination"
            direction="row"
            spacing={1}
            sx={{ flexWrap: "wrap", mt: 1 }}
          >
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel htmlFor="admin-users-page-size-native">Page size</InputLabel>
              <NativeSelect
                id="admin-users-page-size"
                inputProps={{
                  "aria-label": "Page size",
                  "data-cy": "admin-users-page-size",
                  id: "admin-users-page-size-native"
                }}
                onChange={(event) => goToPage(1, Number(event.target.value))}
                value={String(pageSize)}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </NativeSelect>
            </FormControl>
            <Button data-cy="admin-users-page-first" disabled={disablePrev} onClick={() => goToPage(1)} type="button" variant="outlined">
              First
            </Button>
            <Button data-cy="admin-users-page-prev" disabled={disablePrev} onClick={() => goToPage(currentPage - 1)} type="button" variant="outlined">
              Previous
            </Button>
            <Typography data-cy="admin-users-page-indicator" sx={{ fontWeight: 600 }}>
              Page {currentPage} of {totalPages}
            </Typography>
            <Button data-cy="admin-users-page-next" disabled={disableNext} onClick={() => goToPage(currentPage + 1)} type="button" variant="outlined">
              Next
            </Button>
            <Button data-cy="admin-users-page-last" disabled={disableNext} onClick={() => goToPage(totalPages)} type="button" variant="outlined">
              Last
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
