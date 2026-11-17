// Pengirim data dari simulasi 3D Unity ke Firebase Realtime Database (REST).
// Tidak perlu Firebase SDK. Belum diuji di Unity oleh pembuat repo ini, jadi uji dulu dengan
// mock server (database/tools/mock-rtdb.js) sebelum memakai database asli.
//
// Cara pakai:
//   1. Tambahkan skrip ini ke sebuah GameObject.
//   2. Isi Database Url (dan Api Key, Email, Password bila memakai rules aman).
//   3. Dari skrip simulasi Anda panggil:  sender.Send(debit, vbat, rpmShaft, rpmGen);
//      Satuan: debit L/s, vbat Volt, rpmShaft dan rpmGen RPM.
using System;
using System.Collections;
using System.Globalization;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

public class VortexFirebaseSender : MonoBehaviour
{
    [Header("Firebase")]
    public string databaseUrl = "https://NAMA-PROYEK-default-rtdb.asia-southeast1.firebasedatabase.app";
    public string path = "vortexhydro/live";
    [Header("Login simulator (kosongkan bila memakai rules quickstart atau mock)")]
    public string apiKey = "";
    public string email = "";
    public string password = "";
    [Header("Pengiriman")]
    public float minIntervalSeconds = 0.2f;

    string idToken, refreshToken;
    double expiresAt;
    float lastSent;
    bool busy;

    IEnumerator Start()
    {
        if (!string.IsNullOrEmpty(email)) yield return SignIn();
    }

    // Aman dipanggil tiap frame: pengiriman dibatasi oleh minIntervalSeconds.
    public void Send(float debit, float vbat, float rpmShaft, float rpmGen)
    {
        if (busy || Time.unscaledTime - lastSent < minIntervalSeconds) return;
        lastSent = Time.unscaledTime;
        StartCoroutine(Put(debit, vbat, rpmShaft, rpmGen));
    }

    static string N(float v) { return Math.Round(v, 3).ToString("0.###", CultureInfo.InvariantCulture); } // titik, bukan koma

    IEnumerator SignIn()
    {
        string url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + apiKey;
        string json = "{\"email\":\"" + email + "\",\"password\":\"" + password + "\",\"returnSecureToken\":true}";
        using (var req = Json(url, "POST", json))
        {
            yield return req.SendWebRequest();
            if (req.result != UnityWebRequest.Result.Success) { Debug.LogError("Login Firebase gagal: " + req.downloadHandler.text); yield break; }
            var r = JsonUtility.FromJson<SignInResponse>(req.downloadHandler.text);
            idToken = r.idToken; refreshToken = r.refreshToken;
            expiresAt = Time.realtimeSinceStartupAsDouble + double.Parse(r.expiresIn, CultureInfo.InvariantCulture) - 60;
        }
    }

    IEnumerator Refresh()
    {
        string url = "https://securetoken.googleapis.com/v1/token?key=" + apiKey;
        var form = new WWWForm();
        form.AddField("grant_type", "refresh_token");
        form.AddField("refresh_token", refreshToken);
        using (var req = UnityWebRequest.Post(url, form))
        {
            yield return req.SendWebRequest();
            if (req.result != UnityWebRequest.Result.Success) { Debug.LogError("Token gagal diperbarui: " + req.downloadHandler.text); yield break; }
            var r = JsonUtility.FromJson<RefreshResponse>(req.downloadHandler.text);
            idToken = r.id_token; refreshToken = r.refresh_token;
            expiresAt = Time.realtimeSinceStartupAsDouble + double.Parse(r.expires_in, CultureInfo.InvariantCulture) - 60;
        }
    }

    IEnumerator Put(float debit, float vbat, float rpmShaft, float rpmGen)
    {
        busy = true;
        if (!string.IsNullOrEmpty(idToken) && Time.realtimeSinceStartupAsDouble >= expiresAt) yield return Refresh();
        long ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        string json = "{\"debit\":" + N(debit) + ",\"vbat\":" + N(vbat) + ",\"rpmShaft\":" + N(rpmShaft) +
                      ",\"rpmGen\":" + N(rpmGen) + ",\"ts\":" + ts + "}";
        string url = databaseUrl.TrimEnd('/') + "/" + path.Trim('/') + ".json" +
                     (string.IsNullOrEmpty(idToken) ? "" : "?auth=" + UnityWebRequest.EscapeURL(idToken));
        using (var req = Json(url, "PUT", json))
        {
            yield return req.SendWebRequest();
            if (req.result != UnityWebRequest.Result.Success)
                Debug.LogWarning("Firebase menolak data (" + req.responseCode + "): " + req.downloadHandler.text);
        }
        busy = false;
    }

    static UnityWebRequest Json(string url, string method, string json)
    {
        var req = new UnityWebRequest(url, method);
        req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        return req;
    }

    [Serializable] class SignInResponse { public string idToken; public string refreshToken; public string expiresIn; }
    [Serializable] class RefreshResponse { public string id_token; public string refresh_token; public string expires_in; }
}
