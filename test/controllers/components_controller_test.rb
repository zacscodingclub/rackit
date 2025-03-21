require "test_helper"

class ComponentsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @component = components(:one)
  end

  test "should get index" do
    get components_url
    assert_response :success
  end

  test "should get show" do
    # The component belongs to users(:one), we're already signed in as users(:one)
    get component_url(@component)
    assert_response :success
  end

  test "should get new" do
    sign_in_as users(:one)
    get new_component_url
    assert_response :success
  end

  test "should get edit" do
    sign_in_as users(:one)
    get edit_component_url(@component)
    assert_response :success
  end
end
