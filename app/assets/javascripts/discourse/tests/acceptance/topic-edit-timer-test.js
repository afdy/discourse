import {
  acceptance,
  queryAll,
  updateCurrentUser,
} from "discourse/tests/helpers/qunit-helpers";
import { click, fillIn, visit } from "@ember/test-helpers";
import { test } from "qunit";
import selectKit from "discourse/tests/helpers/select-kit-helper";

acceptance("Topic - Edit timer", function (needs) {
  needs.user();
  needs.pretender((server, helper) => {
    server.post("/t/280/timer", () =>
      helper.response({
        success: "OK",
        execute_at: new Date(
          new Date().getTime() + 1 * 60 * 60 * 1000
        ).toISOString(),
        duration: 1,
        based_on_last_post: false,
        closed: false,
        category_id: null,
      })
    );
  });

  test("autoclose - specific time", async function (assert) {
    updateCurrentUser({ moderator: true });
    await visit("/t/internationalization-localization");
    await click(".toggle-admin-menu");
    await click(".topic-admin-status-update button");

    await click("#tap_tile_next_week");

    const regex = /will automatically close in/g;
    const html = queryAll(".edit-topic-timer-modal .topic-status-info")
      .html()
      .trim();
    assert.ok(regex.test(html));
  });

  test("autoclose", async function (assert) {
    updateCurrentUser({ moderator: true });

    await visit("/t/internationalization-localization");
    await click(".toggle-admin-menu");
    await click(".topic-admin-status-update button");

    await click("#tap_tile_next_week");

    const regex1 = /will automatically close in/g;
    const html1 = queryAll(".edit-topic-timer-modal .topic-status-info")
      .html()
      .trim();
    assert.ok(regex1.test(html1));

    await click("#tap_tile_custom");
    await fillIn(".tap-tile-date-input .date-picker", "2099-11-24");

    const regex2 = /will automatically close in/g;
    const html2 = queryAll(".edit-topic-timer-modal .topic-status-info")
      .html()
      .trim();
    assert.ok(regex2.test(html2));

    await click("#tap_tile_set_based_on_last_post");
    await fillIn("#topic_timer_duration", "2");

    const regex3 = /last post in the topic is already/g;
    const html3 = queryAll(".edit-topic-timer-modal .warning").html().trim();
    assert.ok(regex3.test(html3));
  });

  test("close temporarily", async function (assert) {
    updateCurrentUser({ moderator: true });
    const timerType = selectKit(".select-kit.timer-type");

    await visit("/t/internationalization-localization");
    await click(".toggle-admin-menu");
    await click(".topic-admin-status-update button");

    await timerType.expand();
    await timerType.selectRowByValue("open");

    await click("#tap_tile_next_week");

    const regex1 = /will automatically open in/g;
    const html1 = queryAll(".edit-topic-timer-modal .topic-status-info")
      .html()
      .trim();
    assert.ok(regex1.test(html1));

    await click("#tap_tile_custom");
    await fillIn(".tap-tile-date-input .date-picker", "2099-11-24");

    const regex2 = /will automatically open in/g;
    const html2 = queryAll(".edit-topic-timer-modal .topic-status-info")
      .html()
      .trim();
    assert.ok(regex2.test(html2));
  });

  test("schedule", async function (assert) {
    updateCurrentUser({ moderator: true });
    const timerType = selectKit(".select-kit.timer-type");
    const categoryChooser = selectKit(".modal-body .category-chooser");

    await visit("/t/internationalization-localization");
    await click(".toggle-admin-menu");
    await click(".topic-admin-status-update button");

    await timerType.expand();
    await timerType.selectRowByValue("publish_to_category");

    assert.equal(categoryChooser.header().label(), "uncategorized");
    assert.equal(categoryChooser.header().value(), null);

    await categoryChooser.expand();
    await categoryChooser.selectRowByValue("7");

    await click("#tap_tile_next_week");

    const regex = /will be published to #dev/g;
    const text = queryAll(".edit-topic-timer-modal .topic-status-info")
      .text()
      .trim();
    assert.ok(regex.test(text));
  });

  test("TL4 can't auto-delete", async function (assert) {
    updateCurrentUser({ moderator: false, admin: false, trust_level: 4 });

    await visit("/t/internationalization-localization");
    await click(".toggle-admin-menu");
    await click(".topic-admin-status-update button");

    const timerType = selectKit(".select-kit.timer-type");

    await timerType.expand();

    assert.ok(!timerType.rowByValue("delete").exists());
  });

  test("auto delete", async function (assert) {
    updateCurrentUser({ moderator: true });
    const timerType = selectKit(".select-kit.timer-type");

    await visit("/t/internationalization-localization");
    await click(".toggle-admin-menu");
    await click(".topic-admin-status-update button");

    await timerType.expand();
    await timerType.selectRowByValue("delete");

    await click("#tap_tile_two_weeks");

    const regex = /will be automatically deleted/g;
    const html = queryAll(".edit-topic-timer-modal .topic-status-info")
      .html()
      .trim();
    assert.ok(regex.test(html));
  });

  test("Inline delete timer", async function (assert) {
    updateCurrentUser({ moderator: true });

    await visit("/t/internationalization-localization");
    await click(".toggle-admin-menu");
    await click(".topic-admin-status-update button");
    await click("#tap_tile_next_week");
    await click(".edit-topic-timer-buttons button.btn-primary");

    const removeTimerButton = queryAll(
      ".topic-status-info .topic-timer-remove"
    );
    assert.equal(removeTimerButton.attr("title"), "remove timer");

    await click(".topic-status-info .topic-timer-remove");
    const topicStatusInfo = queryAll(".topic-status-info .topic-timer-remove");
    assert.equal(topicStatusInfo.length, 0);
  });
});
