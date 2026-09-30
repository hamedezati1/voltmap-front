import { useMemo, useState } from "react";
import {
  Zap,
  Plus,
  Trash2,
  Star,
  Upload,
  X,
  CheckCircle,
  Search,
  Pencil,
} from "lucide-react";
import { createStation, deleteStation, updateStation } from "../../api";
import { EMPTY_FORM, STATUSES } from "./constants";

export default function StationsPanel({ stations, setStations }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [addMode, setAddMode] = useState(false);
  const [editStation, setEditStation] = useState(null);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleAdd = async () => {
    if (!form.name.trim() || !form.city.trim())
      return alert("نام و شهر را وارد کنید");
    try {
      const payload = {
        ...form,
        connectors: form.connectors || form.connector,
        maxPower: form.maxPower || String(form.power || ""),
        pricePerKwh: form.pricePerKwh || form.price || null,
        image1: form.image1 || form.image || null,
        acPorts: Number(form.acPorts) || 0,
        dcPorts: Number(form.dcPorts) || 0,
      };
      if (editStation) {
        const updated = await updateStation(editStation.id, payload);
        setStations((prev) =>
          prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
        );
        setEditStation(null);
      } else {
        const created = await createStation(payload);
        setStations((prev) => [created, ...prev]);
      }
      setForm(EMPTY_FORM);
      setImagePreview("");
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setAddMode(false);
      }, 1500);
    } catch (err) {
      alert(err.message || "خطا در ذخیره ایستگاه");
    }
  };

  const handleEditStart = (station) => {
    setEditStation(station);
    setForm({
      code: station.code || "",
      name: station.name,
      operator: station.operator || "",
      province: station.province || "",
      city: station.city,
      district: station.district || "",
      address: station.address,
      lat: station.lat ?? 35.7219,
      lng: station.lng ?? 51.3347,
      acPorts: station.acPorts ?? 0,
      dcPorts: station.dcPorts ?? 0,
      maxPower: station.maxPower || String(station.power || ""),
      connectors: station.connectors || station.connector || "",
      parkingSpots: station.parkingSpots || "",
      isFree: Boolean(station.isFree),
      pricePerKwh: station.pricePerKwh || "",
      isActive: station.isActive !== false,
      isVerified: Boolean(station.isVerified),
      hours: station.hours || "۲۴ ساعته",
      phone: station.phone || "",
      image1: station.image1 || station.image || "",
      description: station.description || "",
      status: station.status,
      type: station.type,
      connector: station.connector || station.connectors || "",
      power: station.power,
      ports: station.ports,
      price: station.price || "",
      image: station.image || "",
    });
    setImagePreview(station.image || station.image1 || "");
    setAddMode(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("حذف شود؟")) return;
    try {
      await deleteStation(id);
      setStations((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.message || "خطا در حذف ایستگاه");
    }
  };

  const handleToggleStatus = async (id, status) => {
    const next =
      STATUSES[
        (STATUSES.findIndex((s) => s.value === status) + 1) % STATUSES.length
      ].value;
    try {
      const updated = await updateStation(id, { status: next });
      setStations((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
      );
    } catch (err) {
      alert(err.message || "خطا در تغییر وضعیت");
    }
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const filtered = useMemo(
    () =>
      stations.filter(
        (s) => !search || s.name.includes(search) || s.city.includes(search),
      ),
    [stations, search],
  );

  const inputStyle = {
    width: "100%",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "9px 13px",
    fontSize: 13,
    fontFamily: "Vazirmatn",
    outline: "none",
    background: "rgba(255,255,255,0.06)",
    color: "#1a1a1a",
  };
  const selectStyle = { ...inputStyle };

  return (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                  gap: 16,
                }}
              >
                <div style={{ position: "relative" }}>
                  <Search
                    size={15}
                    color="#aaa"
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="جستجوی ایستگاه..."
                    style={{
                      ...inputStyle,
                      paddingRight: 36,
                      width: 260,
                      background: "#fff",
                    }}
                  />
                </div>
                <button
                  onClick={() => setAddMode((m) => !m)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#2ECC71",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    padding: "10px 20px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Vazirmatn",
                    boxShadow: "0 4px 12px rgba(46,204,113,0.3)",
                  }}
                >
                  <Plus size={16} /> افزودن ایستگاه جدید
                </button>
              </div>

              {/* Add form */}
              {addMode && (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 28,
                    border: "1px solid #eef0f3",
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#1a1a1a",
                      }}
                    >
                      {editStation ? "ویرایش ایستگاه" : "ایستگاه جدید"}
                    </span>
                    <button
                      onClick={() => setAddMode(false)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <X size={20} color="#aaa" />
                    </button>
                  </div>

                  {/* Image upload */}
                  <div style={{ marginBottom: 20 }}>
                    <label
                      style={{
                        fontSize: 12,
                        color: "#888",
                        display: "block",
                        marginBottom: 8,
                        fontWeight: 500,
                      }}
                    >
                      تصویر ایستگاه
                    </label>
                    <div
                      style={{
                        border: "2px dashed #e0e0e0",
                        borderRadius: 14,
                        padding: 20,
                        textAlign: "center",
                        cursor: "pointer",
                        position: "relative",
                        background: "#fafafa",
                        transition: "border-color 0.2s",
                      }}
                    >
                      {imagePreview ? (
                        <div
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          <img
                            src={imagePreview}
                            style={{
                              height: 120,
                              borderRadius: 10,
                              objectFit: "cover",
                            }}
                            alt=""
                          />
                          <button
                            onClick={() => setImagePreview("")}
                            style={{
                              position: "absolute",
                              top: -8,
                              left: -8,
                              background: "#e74c3c",
                              border: "none",
                              borderRadius: "50%",
                              width: 24,
                              height: 24,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <X size={12} color="#fff" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload
                            size={32}
                            color="#ccc"
                            style={{ margin: "0 auto 10px" }}
                          />
                          <p style={{ fontSize: 13, color: "#aaa" }}>
                            کلیک کنید یا عکس را اینجا بکشید
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              color: "#ccc",
                              marginTop: 4,
                            }}
                          >
                            PNG، JPG تا ۵ مگابایت
                          </p>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImage}
                        style={{
                          position: "absolute",
                          inset: 0,
                          opacity: 0,
                          cursor: "pointer",
                          width: "100%",
                          height: "100%",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 2fr",
                      gap: 14,
                      marginBottom: 14,
                    }}
                  >
                    {[
                      ["کد ایستگاه", "code", "text"],
                      ["نام ایستگاه *", "name", "text"],
                      ["اپراتور", "operator", "text"],
                      ["استان", "province", "text"],
                      ["شهر *", "city", "text"],
                      ["منطقه", "district", "text"],
                      ["آدرس کامل", "address", "text"],
                    ].map(([label, key]) => (
                      <div key={key}>
                        <label
                          style={{
                            fontSize: 12,
                            color: "#888",
                            display: "block",
                            marginBottom: 6,
                          }}
                        >
                          {label}
                        </label>
                        <input
                          value={form[key]}
                          onChange={(e) => f(key, e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6,1fr)",
                      gap: 14,
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        نوع شارژر
                      </label>
                      <select
                        value={form.type}
                        onChange={(e) => {
                          const t = e.target.value;
                          // وقتی type عوض می‌شه connector رو هم ریست کن
                          const defaultConn =
                            t === "DC"
                              ? "CCS2"
                              : t === "AC"
                                ? "Type2"
                                : "CCS2+Type2";
                          f("type", t);
                          f("connector", defaultConn);
                          f("connectors", defaultConn);
                        }}
                        style={selectStyle}
                      >
                        {["AC", "DC", "AC/DC"].map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        کانکتور
                        <span
                          style={{
                            fontSize: 10,
                            color: "#aaa",
                            marginRight: 4,
                          }}
                        >
                          {form.type === "DC"
                            ? "(DC نازل)"
                            : form.type === "AC"
                              ? "(AC نازل)"
                              : "(DC + AC نازل)"}
                        </span>
                      </label>
                      <select
                        value={form.connector}
                        onChange={(e) => {
                          f("connector", e.target.value);
                          f("connectors", e.target.value);
                        }}
                        style={selectStyle}
                      >
                        {form.type === "DC" &&
                          ["CCS2", "GB/T", "CCS2+GB/T"].map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        {form.type === "AC" &&
                          ["Type2", "GB/T", "Type2+GB/T"].map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        {form.type === "AC/DC" &&
                          [
                            "CCS2+Type2",
                            "CCS2+GB/T",
                            "Type2+GB/T",
                            "CCS2+GB/T+Type2",
                          ].map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        توان (kW)
                      </label>
                      <input
                        value={form.maxPower}
                        onChange={(e) => {
                          f("maxPower", e.target.value);
                          const n = Number(
                            String(e.target.value).match(
                              /(\d+(?:\.\d+)?)/,
                            )?.[1],
                          );
                          if (Number.isFinite(n)) f("power", n);
                        }}
                        placeholder="مثلاً 60 یا 60-7.4"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        پورت AC
                      </label>
                      <input
                        type="number"
                        value={form.acPorts}
                        onChange={(e) => f("acPorts", Number(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        پورت DC
                      </label>
                      <input
                        type="number"
                        value={form.dcPorts}
                        onChange={(e) => f("dcPorts", Number(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        قیمت هر kWh
                      </label>
                      <input
                        value={form.pricePerKwh}
                        onChange={(e) => {
                          f("pricePerKwh", e.target.value);
                          f("price", e.target.value);
                        }}
                        placeholder="۴۸۷۱"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        ساعات
                      </label>
                      <input
                        value={form.hours}
                        onChange={(e) => f("hours", e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 14,
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        عرض جغرافیایی
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={form.lat}
                        onChange={(e) => f("lat", Number(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        طول جغرافیایی
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={form.lng}
                        onChange={(e) => f("lng", Number(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "#888",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        وضعیت اولیه
                      </label>
                      <select
                        value={form.status}
                        onChange={(e) => f("status", e.target.value)}
                        style={selectStyle}
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {saved && (
                    <div
                      style={{
                        background: "#e8faf0",
                        color: "#27AE60",
                        padding: 12,
                        borderRadius: 12,
                        textAlign: "center",
                        fontSize: 13,
                        marginBottom: 14,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <CheckCircle size={16} />
                      ایستگاه با موفقیت اضافه شد!
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={handleAdd}
                      style={{
                        background: "#2ECC71",
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        padding: "13px 28px",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "Vazirmatn",
                        boxShadow: "0 4px 14px rgba(46,204,113,0.3)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Zap size={16} />
                      {editStation ? "ذخیره تغییرات" : "ثبت ایستگاه"}
                    </button>
                    {editStation && (
                      <button
                        onClick={() => {
                          setEditStation(null);
                          setForm(EMPTY_FORM);
                          setImagePreview("");
                          setAddMode(false);
                        }}
                        style={{
                          background: "#f5f5f5",
                          color: "#555",
                          border: "none",
                          borderRadius: 12,
                          padding: "13px 22px",
                          fontSize: 14,
                          cursor: "pointer",
                          fontFamily: "Vazirmatn",
                        }}
                      >
                        انصراف
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Table */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  border: "1px solid #eef0f3",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fb" }}>
                      {[
                        "",
                        "نام ایستگاه",
                        "شهر",
                        "اپراتور",
                        "نوع",
                        "سوکت",
                        "توان",
                        "پورت",
                        "وضعیت",
                        "امتیاز",
                        "عملیات",
                      ].map((h, i) => (
                        <th
                          key={i}
                          style={{
                            padding: "13px 16px",
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
                    {filtered.map((s) => {
                      const st =
                        STATUSES.find((x) => x.value === s.status) ||
                        STATUSES[0];
                      return (
                        <tr
                          key={s.id}
                          style={{
                            borderTop: "1px solid #f5f7fa",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#fafbfc")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td style={{ padding: "12px 16px" }}>
                            <div
                              style={{
                                width: 46,
                                height: 46,
                                borderRadius: 11,
                                overflow: "hidden",
                                background: "#e8faf0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {s.image ? (
                                <img
                                  src={s.image}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                  alt=""
                                />
                              ) : (
                                <Zap size={20} color="#2ECC71" />
                              )}
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
                            {s.name}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 13,
                              color: "#666",
                            }}
                          >
                            {s.city}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 12,
                              color: "#888",
                            }}
                          >
                            {s.operator || "—"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                fontSize: 11,
                                background: "#e8faf0",
                                color: "#27AE60",
                                padding: "3px 10px",
                                borderRadius: 8,
                                fontWeight: 500,
                              }}
                            >
                              {s.type}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 13,
                              color: "#666",
                            }}
                          >
                            {s.connectors || s.connector || "—"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 13,
                              color: "#666",
                            }}
                          >
                            {s.maxPower || s.power || "—"}kW
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 13,
                              color: "#666",
                            }}
                          >
                            {`AC:${s.acPorts ?? 0} / DC:${s.dcPorts ?? 0}`}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <button
                              onClick={() => handleToggleStatus(s.id, s.status)}
                              style={{
                                fontSize: 11,
                                padding: "4px 12px",
                                borderRadius: 20,
                                background: st.bg,
                                color: st.color,
                                fontWeight: 600,
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "Vazirmatn",
                              }}
                            >
                              {st.label}
                            </button>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Star
                                size={13}
                                color="#F39C12"
                                fill={s.rating ? "#F39C12" : "none"}
                              />
                              <span
                                style={{
                                  fontSize: 13,
                                  color: "#1a1a1a",
                                  fontWeight: 600,
                                }}
                              >
                                {s.rating || "—"}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => handleEditStart(s)}
                                title="ویرایش"
                                style={{
                                  background: "#EBF5FB",
                                  border: "none",
                                  borderRadius: 9,
                                  padding: "7px 10px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <Pencil size={14} color="#2980B9" />
                              </button>
                              <button
                                onClick={() => handleDelete(s.id)}
                                title="حذف"
                                style={{
                                  background: "#FCEBEB",
                                  border: "none",
                                  borderRadius: 9,
                                  padding: "7px 10px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <Trash2 size={14} color="#A32D2D" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div
                    style={{ textAlign: "center", padding: 48, color: "#aaa" }}
                  >
                    <Search
                      size={36}
                      color="#ddd"
                      style={{ margin: "0 auto 12px" }}
                    />
                    <p style={{ fontSize: 14 }}>نتیجه‌ای یافت نشد</p>
                  </div>
                )}
              </div>
            </>
  );
}
