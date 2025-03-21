class ServerRacksController < ApplicationController
  allow_unauthenticated_access only: %i[ index show ]
  before_action :set_current_user  # Try to set Current.user for all actions
  before_action :set_server_rack, only: %i[ show edit update destroy check_position ] # Not applied to new or create

  # GET /server_racks or /server_racks.json
  def index
    # Show all server racks to all users
    @server_racks = ServerRack.all
  end

  # GET /server_racks/1 or /server_racks/1.json
  def show
    # Current.user is set by set_current_user if available
  end

  # GET /server_racks/new
  def new
    @server_rack = ServerRack.new
  end

  # GET /server_racks/1/edit
  def edit
  end

  # POST /server_racks or /server_racks.json
  def create
    @server_rack = ServerRack.new(server_rack_params)
    @server_rack.user = Current.user if Current.user

    respond_to do |format|
      if @server_rack.save
        format.html { redirect_to @server_rack, notice: "Server rack was successfully created." }
        format.json { render :show, status: :created, location: @server_rack }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @server_rack.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /server_racks/1 or /server_racks/1.json
  def update
    respond_to do |format|
      if @server_rack.update(server_rack_params)
        format.html { redirect_to @server_rack, notice: "Server rack was successfully updated." }
        format.json { render :show, status: :ok, location: @server_rack }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @server_rack.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /server_racks/1 or /server_racks/1.json
  def destroy
    @server_rack.destroy!

    respond_to do |format|
      format.html { redirect_to server_racks_path, status: :see_other, notice: "Server rack was successfully destroyed." }
      format.json { head :no_content }
    end
  end
  
  # GET /server_racks/1/check_position
  def check_position
    component_id = params[:component_id]
    position = params[:position].to_i
    
    component = Component.find(component_id)
    
    # Check if position is valid
    if position < 1 || position + component.height - 1 > @server_rack.height
      render json: { available: false, message: "Position out of rack bounds" }
      return
    end
    
    # Check if position is available
    available = @server_rack.position_available?(position, component.height)
    
    if available
      render json: { available: true }
    else
      render json: { 
        available: false, 
        message: "Position conflicts with existing components"
      }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_server_rack
      # Find the server rack by ID (allow viewing any rack)
      @server_rack = ServerRack.find_by(id: params[:id])
      
      # Handle case where rack not found
      redirect_to server_racks_path, alert: "Server rack not found." and return unless @server_rack
      
      # Set the ownership variable for use in views
      @is_owner = Current.user && Current.user.id == @server_rack.user_id
      
      # For edit/update/destroy actions, verify ownership
      if ['edit', 'update', 'destroy'].include?(action_name) && !@is_owner
        redirect_to server_racks_path, alert: "You can only edit your own server racks." and return 
      end
      
      # Load the components for this rack through the rack_components association
      @rack_components = @server_rack.rack_components.includes(:component).order(:position_y)
    end

    # Only allow a list of trusted parameters through.
    def server_rack_params
      params.require(:server_rack).permit(:name, :height, :depth)
    end
    
    def set_current_user
      # Use the existing session resumption mechanism to try to set Current.user
      # This is called even for actions that skip require_authentication
      Current.session ||= find_session_by_cookie
    end
end