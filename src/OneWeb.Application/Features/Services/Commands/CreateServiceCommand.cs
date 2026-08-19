using MediatR;

namespace OneWeb.Application.Features.Services.Commands;

public record CreateServiceCommand : IRequest<long>
{
   public string Name {get;set;}
   public string? Slug {get;set;}
    public string? BannerImage { get; set; }
    public long? ParentId {get;set;}
   public int Level {get;set;}
   public double InitialPrice {get;set;}
   public string? ServiceIcon {get;set;}
   public string? PriceUnit {get;set;}
   public double? Rating {get;set;}
   public int? ReviewCount {get;set;}
   public string? HeroTitle {get;set;}
   public string? HeroSubtitle {get;set;}
  public bool Status { get; set; }
}
