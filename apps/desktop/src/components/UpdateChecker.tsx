import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import UpdateDialog from "../components/UpdateDialog";

import { checkUpdate, downloadAndInstallUpdate, restartAfterUpdate } from "../update";

import type { UpdateInfo } from "../services/updateService";

import { isUpdateSnoozed } from "../store/update";



export function UpdateChecker({ children }: { children: React.ReactNode }) {

  const location = useLocation();
  const skipUpdateCheck = location.pathname === "/login" || location.pathname === "/register";

  const [info, setInfo] = useState<UpdateInfo | null>(null);

  const [downloading, setDownloading] = useState(false);

  const [progress, setProgress] = useState(0);

  const [blocked, setBlocked] = useState(false);



  useEffect(() => {

    if (skipUpdateCheck) return;

    void (async () => {

      const latest = await checkUpdate();

      if (!latest?.hasUpdate) return;

      if (latest.forceUpdate) {

        setBlocked(true);

        setInfo(latest);

        return;

      }

      if (isUpdateSnoozed()) return;

      setInfo(latest);

    })();

  }, [skipUpdateCheck]);



  async function handleUpdate() {

    if (!info) return;

    setDownloading(true);

    try {

      const mode = await downloadAndInstallUpdate(info, setProgress);

      if (mode === "tauri") {

        await restartAfterUpdate("tauri");

        return;

      }

      alert(`安装包已下载。请运行安装程序完成 v${info.version} 升级，完成后重启应用。`);

      if (!info.forceUpdate) setInfo(null);

    } catch (err) {

      alert(err instanceof Error ? err.message : "下载失败");

    } finally {

      setDownloading(false);

      setProgress(0);

    }

  }



  if (blocked && info?.forceUpdate) {

    return (

      <UpdateDialog

        info={info}

        force

        downloading={downloading}

        progress={progress}

        onUpdate={() => void handleUpdate()}

        onLater={() => {}}

      />

    );

  }



  return (

    <>

      {children}

      {info && !info.forceUpdate && (

        <UpdateDialog

          info={info}

          downloading={downloading}

          progress={progress}

          onUpdate={() => void handleUpdate()}

          onLater={() => setInfo(null)}

        />

      )}

    </>

  );

}


