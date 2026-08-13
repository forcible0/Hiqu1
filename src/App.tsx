import { AppModals } from "./components/AppModals";
import { AuthScreen } from "./components/AuthScreen";
import { ChatView } from "./components/ChatView";
import { HomeSidebar, ServerSidebarPanel } from "./components/ChannelSidebar";
import { FriendsView } from "./components/FriendsView";
import { MembersSidebar } from "./components/MembersSidebar";
import { ProfileSidebar } from "./components/ProfileSidebar";
import { ServerSidebar } from "./components/ServerSidebar";
import { AppProvider, useApp } from "./context/AppContext";
import type { User } from "./types";

function AppContent() {
  const app = useApp();

  if (!app.token || !app.currentUser) {
    return <AuthScreen onLogin={app.login} onRegister={app.register} />;
  }

  if (app.loading) {
    return (
      <div className="flex h-full items-center justify-center bg-hiqu-bg">
        <div className="text-hiqu-muted">Yükleniyor...</div>
      </div>
    );
  }

  const activeServer =
    app.activeServerId !== "home"
      ? app.servers.find((s) => s.id === app.activeServerId)
      : null;
  const activeDmUser = app.activeDmId
    ? app.friends.find((u) => u.id === app.activeDmId) ??
      app.dmPartners.find((u) => u.id === app.activeDmId)
    : null;
  const activeChannel = app.channels.find((c) => c.id === app.activeChannelId);

  const authorMap: Record<string, User> = {};
  for (const u of [...app.friends, ...app.serverMembers, ...app.dmPartners]) {
    authorMap[u.id] = u;
  }
  if (app.currentUser) authorMap[app.currentUser.id] = app.currentUser;

  const openSettings = () => app.setActiveModal("settings");

  return (
    <>
      <div className="flex h-full overflow-hidden">
        <ServerSidebar
          servers={app.servers}
          activeId={app.activeServerId}
          onSelectHome={app.openHome}
          onSelectServer={app.openServer}
          onCreateServer={() => app.setActiveModal("createServer")}
          onJoinServer={() => app.setActiveModal("joinServer")}
        />

        {app.activeServerId === "home" ? (
          <HomeSidebar
            currentUser={app.currentUser}
            friends={app.friends}
            dmPartners={app.dmPartners}
            activeDmId={app.activeDmId}
            friendsActive={app.view === "friends"}
            onFriendsClick={app.openHome}
            onSelectDm={app.openDm}
            onNewDm={() => app.setActiveModal("newDm")}
            onSettings={openSettings}
            onLogout={app.logout}
          />
        ) : activeServer ? (
          <ServerSidebarPanel
            server={activeServer}
            channels={app.channels}
            activeChannelId={app.activeChannelId}
            currentUser={app.currentUser}
            isOwner={activeServer.ownerId === app.currentUser.id}
            onSelectChannel={app.openChannel}
            onCreateChannel={() => app.setActiveModal("createChannel")}
            onSettings={openSettings}
            onLogout={app.logout}
          />
        ) : null}

        {app.view === "friends" && app.activeServerId === "home" && (
          <FriendsView
            tab={app.friendsTab}
            onTabChange={app.setFriendsTab}
            friends={app.friends}
            pending={app.pending}
            blocked={app.blocked}
            onAddFriend={() => app.setActiveModal("addFriend")}
            onMessage={app.openDm}
            onAccept={app.acceptFriend}
            onDecline={app.declineFriend}
            onCancel={app.cancelFriendRequest}
            onBlock={app.blockUser}
            onUnblock={app.unblockUser}
            onRemove={app.removeFriend}
          />
        )}

        {app.view === "dm" && activeDmUser && (
          <ChatView
            title={activeDmUser.name}
            subtitle={`@${activeDmUser.username}`}
            avatar={activeDmUser.avatar}
            status={activeDmUser.status}
            messages={app.dmMessages[activeDmUser.id] ?? []}
            authorMap={authorMap}
            placeholder={`@${activeDmUser.username} kullanıcısına mesaj`}
            onSend={(c) => app.sendDm(activeDmUser.id, c)}
            emptyMessage={`${activeDmUser.name} ile sohbetin başlangıcı.`}
          />
        )}

        {app.view === "channel" && activeChannel && (
          <ChatView
            title={activeChannel.name}
            messages={app.channelMessages[activeChannel.id] ?? []}
            authorMap={authorMap}
            placeholder={`#${activeChannel.name} kanalına mesaj`}
            onSend={(c) => app.sendChannelMessage(activeChannel.id, c)}
            emptyMessage={`#${activeChannel.name} kanalına hoş geldin!`}
          />
        )}

        {app.view === "friends" && app.activeServerId === "home" && (
          <MembersSidebar members={app.friends.filter((f) => f.status !== "offline")} title="Çevrimiçi" />
        )}

        {app.view === "dm" && activeDmUser && (
          <ProfileSidebar user={activeDmUser} onMessage={() => app.openDm(activeDmUser.id)} />
        )}

        {app.view === "channel" && app.activeServerId !== "home" && (
          <MembersSidebar members={app.serverMembers} />
        )}
      </div>
      <AppModals />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
