import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Users,
  Trash2,
  Star,
  Search,
  Phone,
  Mail,
  Calendar,
  Crown,
  ChevronDown,
} from "lucide-react";
import { deleteUser, fetchUsers, updateUserMembership } from "../../api";
import StatCard from "./StatCard";
import { MEMBERSHIP_OPTIONS } from "./constants";

export default function UsersPanel({ stations }) {
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [membershipMenu, setMembershipMenu] = useState(null);
  const [membershipMenuPos, setMembershipMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  const handleMembershipChange = async (userId, membership) => {
    try {
      const updated = await updateUserMembership(userId, membership);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, ...updated, membership } : u,
        ),
      );
    } catch (err) {
      alert(err.message || "خطا در تغییر اشتراک");
    }
    setMembershipMenu(null);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("آیا از حذف این کاربر مطمئن هستید؟")) return;
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.message || "حذف کاربر ممکن نیست");
    }
  };

  const allReviews = useMemo(
    () =>
      stations.flatMap((s) =>
        (s.reviews || []).map((r) => ({
          ...r,
          stationName: s.name,
          stationId: s.id,
        })),
      ),
    [stations],
  );

              const filteredUsers = users.filter(
                (u) =>
                  !userSearch ||
                  u.name?.includes(userSearch) ||
                  u.email?.includes(userSearch) ||
                  u.phone?.includes(userSearch),
              );
              return (
                <>
                  {/* Stats row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4,1fr)",
                      gap: 16,
                      marginBottom: 24,
                    }}
                  >
                    <StatCard
                      label="کل کاربران"
                      value={users.length}
                      sub="ثبت‌نام‌شده"
                      subUp
                      Icon={Users}
                      color="#3498DB"
                      bg="#EBF5FB"
                    />
                    <StatCard
                      label="اشتراک ویژه"
                      value={
                        users.filter((u) => u.membership === "ویژه").length
                      }
                      sub="کاربر فعال"
                      subUp
                      Icon={Crown}
                      color="#F59E0B"
                      bg="#fef9e7"
                    />
                    <StatCard
                      label="اشتراک طلایی"
                      value={
                        users.filter((u) => u.membership === "طلایی").length
                      }
                      sub="کاربر فعال"
                      subUp
                      Icon={Crown}
                      color="#F59E0B"
                      bg="#fef9e7"
                    />
                    <StatCard
                      label="کل نظرات"
                      value={allReviews.length}
                      sub="نظر ثبت شده"
                      subUp
                      Icon={Star}
                      color="#F39C12"
                      bg="#fef9e7"
                    />
                  </div>

                  {/* Users table */}
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 16,
                      border: "1px solid #eef0f3",
                      overflow: "visible",
                      marginBottom: 24,
                    }}
                  >
                    <div
                      style={{
                        padding: "18px 22px",
                        borderBottom: "1px solid #f5f7fa",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#1a1a1a",
                        }}
                      >
                        کاربران ثبت‌نام‌شده
                      </span>
                      <div style={{ position: "relative" }}>
                        <Search
                          size={14}
                          color="#aaa"
                          style={{
                            position: "absolute",
                            right: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                        />
                        <input
                          value={userSearch}
                          onChange={(e) => {
                            setUserSearch(e.target.value);
                            setUsers(readUsers());
                          }}
                          placeholder="جستجو نام، ایمیل، موبایل..."
                          style={{
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 10,
                            padding: "7px 32px 7px 12px",
                            fontSize: 12,
                            fontFamily: "Vazirmatn",
                            outline: "none",
                            width: 220,
                            background: "rgba(255,255,255,0.06)",
                            color: "#1a1a1a",
                          }}
                        />
                      </div>
                    </div>
                    {filteredUsers.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: 40,
                          color: "#aaa",
                        }}
                      >
                        <Users
                          size={36}
                          color="#ddd"
                          style={{ margin: "0 auto 12px" }}
                        />
                        <p style={{ fontSize: 14 }}>
                          {users.length === 0
                            ? "هنوز کاربری ثبت‌نام نکرده"
                            : "نتیجه‌ای یافت نشد"}
                        </p>
                      </div>
                    ) : (
                      <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <thead>
                          <tr style={{ background: "#f8f9fb" }}>
                            {[
                              "#",
                              "نام",
                              "ایمیل",
                              "موبایل",
                              "اشتراک",
                              "تاریخ ثبت‌نام",
                              "",
                            ].map((h, i) => (
                              <th
                                key={i}
                                style={{
                                  padding: "12px 16px",
                                  fontSize: 12,
                                  color: "#888",
                                  fontWeight: 600,
                                  textAlign: "right",
                                  fontFamily: "Vazirmatn",
                                  borderBottom: "1px solid #eef0f3",
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((u, i) => (
                            <tr
                              key={u.id}
                              style={{ borderTop: "1px solid #f5f7fa" }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#fafbfc")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                              }
                            >
                              <td style={{ padding: "12px 16px" }}>
                                <div
                                  style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: "50%",
                                    background:
                                      "linear-gradient(135deg,#3498DB,#1a5a8a)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 700,
                                      color: "#fff",
                                    }}
                                  >
                                    {(u.name || "؟")[0]}
                                  </span>
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "12px 16px",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "#1a1a1a",
                                }}
                              >
                                {u.name || "—"}
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    fontSize: 12,
                                    color: "#666",
                                  }}
                                >
                                  <Mail size={12} color="#aaa" />
                                  {u.email || "—"}
                                </div>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    fontSize: 12,
                                    color: "#666",
                                  }}
                                >
                                  <Phone size={12} color="#aaa" />
                                  {u.phone || "—"}
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "12px 16px",
                                  position: "relative",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <button
                                    onClick={(e) => {
                                      const rect =
                                        e.currentTarget.getBoundingClientRect();
                                      setMembershipMenuPos({
                                        top: rect.bottom + 6,
                                        left: rect.left,
                                      });
                                      setMembershipMenu(
                                        membershipMenu === u.id ? null : u.id,
                                      );
                                    }}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 5,
                                      padding: "4px 10px",
                                      borderRadius: 20,
                                      border: "1.5px solid",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      fontFamily: "Vazirmatn",
                                      background:
                                        u.membership === "ویژه" ||
                                        u.membership === "طلایی"
                                          ? "#fef9e7"
                                          : "#f5f5f5",
                                      borderColor:
                                        u.membership === "ویژه" ||
                                        u.membership === "طلایی"
                                          ? "#F59E0B"
                                          : "#e0e0e0",
                                      color:
                                        u.membership === "ویژه" ||
                                        u.membership === "طلایی"
                                          ? "#D97706"
                                          : "#888",
                                    }}
                                  >
                                    {(u.membership === "ویژه" ||
                                      u.membership === "طلایی") && (
                                      <Crown size={11} />
                                    )}
                                    {u.membership || "رایگان"}
                                    <ChevronDown size={11} />
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    fontSize: 12,
                                    color: "#aaa",
                                  }}
                                >
                                  <Calendar size={12} />
                                  {u.createdAt
                                    ? new Date(u.createdAt).toLocaleDateString(
                                        "fa-IR",
                                      )
                                    : "—"}
                                </div>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  title="حذف کاربر"
                                  style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 8,
                                    background: "#fef2f2",
                                    border: "1px solid #fecaca",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                  }}
                                >
                                  <Trash2 size={13} color="#E74C3C" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Membership dropdown portal — خارج از table تا overflow clip نشه */}
                  {membershipMenu !== null &&
                    (() => {
                      const menuUser = filteredUsers.find(
                        (u) => u.id === membershipMenu,
                      );
                      if (!menuUser) return null;
                      return (
                        <>
                          {/* overlay شفاف برای بستن */}
                          <div
                            style={{ position: "fixed", inset: 0, zIndex: 999 }}
                            onClick={() => setMembershipMenu(null)}
                          />
                          <div
                            style={{
                              position: "fixed",
                              top: membershipMenuPos.top,
                              left: membershipMenuPos.left,
                              zIndex: 1000,
                              background: "#fff",
                              borderRadius: 12,
                              boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
                              border: "1px solid #eee",
                              minWidth: 140,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                padding: "8px 14px 6px",
                                fontSize: 11,
                                color: "#aaa",
                                borderBottom: "1px solid #f5f5f5",
                              }}
                            >
                              نوع اشتراک: {menuUser.name}
                            </div>
                            {MEMBERSHIP_OPTIONS.map((m) => (
                              <button
                                key={m}
                                onClick={() =>
                                  handleMembershipChange(menuUser.id, m)
                                }
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  width: "100%",
                                  padding: "10px 14px",
                                  textAlign: "right",
                                  fontSize: 13,
                                  fontFamily: "Vazirmatn",
                                  border: "none",
                                  cursor: "pointer",
                                  background:
                                    menuUser.membership === m
                                      ? m !== "رایگان"
                                        ? "#fef9e7"
                                        : "#f5f7fa"
                                      : "transparent",
                                  color: m !== "رایگان" ? "#D97706" : "#333",
                                  fontWeight:
                                    menuUser.membership === m ? 700 : 400,
                                  transition: "background 0.1s",
                                }}
                              >
                                {m !== "رایگان" ? (
                                  <Crown size={14} color="#F59E0B" />
                                ) : (
                                  <div
                                    style={{
                                      width: 14,
                                      height: 14,
                                      borderRadius: "50%",
                                      background: "#e0e0e0",
                                    }}
                                  />
                                )}
                                {m}
                                {menuUser.membership === m && (
                                  <span
                                    style={{
                                      marginRight: "auto",
                                      color: "#27AE60",
                                      fontSize: 12,
                                    }}
                                  >
                                    ✓
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      );
                    })()}

                  {/* Reviews */}
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 16,
                      border: "1px solid #eef0f3",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "18px 22px",
                        borderBottom: "1px solid #f5f7fa",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#1a1a1a",
                        }}
                      >
                        نظرات کاربران
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.35)",
                        }}
                      >
                        {allReviews.length} نظر
                      </span>
                    </div>
                    <div style={{ padding: 22 }}>
                      {allReviews.length === 0 ? (
                        <p
                          style={{
                            color: "#aaa",
                            fontSize: 14,
                            textAlign: "center",
                            padding: "40px 0",
                          }}
                        >
                          هنوز هیچ نظری ثبت نشده
                        </p>
                      ) : (
                        allReviews.map((r, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              gap: 16,
                              paddingBottom: 18,
                              marginBottom: 18,
                              borderBottom: "1px solid #f5f7fa",
                            }}
                          >
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                                background: "#EBF5FB",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Users size={18} color="#3498DB" />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: 6,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: "#1a1a1a",
                                  }}
                                >
                                  {r.user || r.userName || r.user_name}
                                </span>
                                <div style={{ display: "flex", gap: 2 }}>
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <Star
                                      key={n}
                                      size={14}
                                      color="#F39C12"
                                      fill={n <= r.rating ? "#F39C12" : "none"}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p
                                style={{
                                  fontSize: 13,
                                  color: "#555",
                                  marginBottom: 6,
                                  lineHeight: 1.6,
                                }}
                              >
                                {r.text}
                              </p>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                }}
                              >
                                <MapPin size={12} color="#2ECC71" />
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "rgba(255,255,255,0.35)",
                                  }}
                                >
                                  {r.stationName}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              );
}
